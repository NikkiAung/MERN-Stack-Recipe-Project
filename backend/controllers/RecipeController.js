const Recipe = require('../models/Recipe');
const mongoose = require('mongoose');
const removeFile = require('../helpers/removeFile')
const User = require('../models/User')
const sendEmail = require('../helpers/sendEmail')
const Queue = require('bull');
const emailQueue = new Queue('audio transcoding', { redis: { port: 6379, host: '127.0.0.1' } });
emailQueue.process(async(job) => {
    setTimeout(async () => {
        await sendEmail(job.data);
    }, 5000);
    
});
const RecipeController = {
    index : async (req, res) => {
        let page = req.query.page || 1;
        let limit = 6;
        let recipes = await Recipe
        .find()
        .skip((page-1)*limit)
        .limit(limit)
        .sort({createAt:-1})
        let totalRecipeCount = await Recipe.countDocuments();
        let totalPagesCount = Math.ceil(totalRecipeCount/limit);
        let links = {
            nextPage : totalPagesCount == page ? false : true,
            prevPage : page == 1 ? false : true,
            currentPage: page,
            loopableLinks: []
        }
        for (let index = 0; index < totalPagesCount; index++) {
            let number = index + 1;
            links.loopableLinks.push({number});
        }
        let response = {
            links,
            data : recipes
        }
        return res.json(response);
    },
    store : async (req, res) => {
        try {
            const {title, description, ingredients} = req.body;
            const recipe = await Recipe.create({
                title, 
                description,
                ingredients
            });
            //send mails -> users -> marketing email
            let user = await User.find(null, ['email']);
            let emails = user.map(user => user.email)
            emails = emails.filter(email => email != req.user.email);
            emailQueue.add(
                {
                    view : 'email',
                    data : {
                        name : req.user.name,
                        recipe
                    },
                    from: req.user.email,
                    to : emails,
                    subject: "New recipe is created by someone",
                }
            )
            return res.json(recipe);
        } catch (e) {
            return res.status(500).json({ msg :e.message});
        }
    },
    show : async (req, res) => {
        try {
            let id = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(id)){
                return res.status(400).json({msg: 'not a valid id'});
            }
            let recipe = await Recipe.findById(id);
            if (!recipe){
                return res.status(404).json({msg: 'recipe not found'});
            }
            return res.json(recipe)
        } catch (error) {
            return res.status(500).json({msg: 'internet server error'});
        }  
    },
    destroy : async (req, res) => {
        try {
            let id = req.params.id;
            if(!mongoose.Types.ObjectId.isValid(id)){
                return res.status(400).json({msg : 'not a valid id'});
            }
            let recipe = await Recipe.findByIdAndDelete(id);
            await removeFile(__dirname+'/../public'+recipe.photo);
            if (!recipe){
                return res.status(404).json({msg : 'recipe not found'});
            }
            return res.json(recipe);
        } catch (error) {
            return res.status(500).json({msg : 'internet server error'});
        }
    },
    update : async (req, res) => {
        try {
            let id = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({msg : 'not a valid id'});
            }
            let recipe = await Recipe.findByIdAndUpdate(id, {
                ...req.body
            });

            await removeFile(__dirname+'/../public'+recipe.photo);

            if (!recipe) {
                return res.status(404).json({msg : 'recipe not found'});
            }
            return res.json(recipe);
        } catch (error) {
            return res.status(500).json({msg : 'internet server error'});
        }
    },
    upload : async (req, res) => {
        try {
            let id = req.params.id;
            if(!mongoose.Types.ObjectId.isValid(id)){
                return res.status(400).json({msg : 'not a valid id'});
            }
            let recipe = await Recipe.findByIdAndUpdate(id, {
                photo : '/'+req.file.filename
            })
            if(!recipe) {
                return res.status(404).json({msg : 'recipe not found'})
            }
            return res.json(recipe);
        } catch (error) {
            return res.status(500).json({msg : 'internet server error'});
        }
    }
}

module.exports = RecipeController;