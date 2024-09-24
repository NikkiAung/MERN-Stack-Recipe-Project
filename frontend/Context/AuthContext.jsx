import { createContext } from "react";

const AuthContext = createContext();

const AuthContextProvider = ({children}) => {
    const user = {
        name: "hlaingminthan"
    }
    return( 
        <AuthContext.Provider value={user}>
            {children}
        </AuthContext.Provider>
    )
}

export {AuthContextProvider, AuthContext}