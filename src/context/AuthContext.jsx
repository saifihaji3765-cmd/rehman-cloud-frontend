import {

  createContext,

  useContext,

  useEffect,

  useState

} from "react";

import {

  getStoredUser,

  isAuthenticated,

  logout

} from "../services/authService";

const AuthContext =
createContext(null);

export function AuthProvider({

  children

}) {

  const [user,setUser] =
  useState(null);

  const [loading,setLoading] =
  useState(true);

  const [

    authenticated,

    setAuthenticated

  ] = useState(false);

  useEffect(()=>{

    try{

      if(

        isAuthenticated()

      ){

        const storedUser =

        getStoredUser();

        if(storedUser){

          setUser(
            storedUser
          );

          setAuthenticated(
            true
          );

        }

      }

    }

    catch(error){

      console.error(
        "Auth initialization failed:",
        error
      );

    }

    finally{

      setLoading(
        false
      );

    }

  },[]);

  async function signOut(){

    try{

      await logout();

    }

    catch(error){

      console.error(
        error
      );

    }

    finally{

      setUser(null);

      setAuthenticated(
        false
      );

    }

  }

  const value = {

    user,

    loading,

    authenticated,

    setUser,

    setAuthenticated,

    signOut

  };

  return (

    <AuthContext.Provider
      value={value}
    >

      {children}

    </AuthContext.Provider>

  );

}

export function useAuth(){

  const context =

  useContext(
    AuthContext
  );

  if(!context){

    throw new Error(

      "useAuth must be used inside AuthProvider"

    );

  }

  return context;

}
