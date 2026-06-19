import {

  createContext,

  useContext,

  useEffect,

  useState

} from "react";

import {

  getCurrentUser,

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
  useState(

    getStoredUser()

  );

  const [loading,setLoading] =
  useState(true);

  const [authenticated,
  setAuthenticated] =

  useState(

    isAuthenticated()

  );

  useEffect(()=>{

    async function initialize(){

      try{

        if(

          isAuthenticated()

        ){

          const response =

          await getCurrentUser();

          setUser(

            response.user

          );

          setAuthenticated(
            true
          );

        }

      }

      catch(error){

        console.error(
          error
        );

      }

      finally{

        setLoading(
          false
        );

      }

    }

    initialize();

  },[]);

  async function signOut(){

    await logout();

    setUser(null);

    setAuthenticated(
      false
    );

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

  return useContext(
    AuthContext
  );

}
