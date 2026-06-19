import {

  Navigate

} from "react-router-dom";

import {

  useAuth

} from "../context/AuthContext";

function ProtectedRoute({

  children

}) {

  const {

    authenticated,

    loading

  } = useAuth();

  if(loading){

    return <div>
      Loading...
    </div>;
  }

  if(

    !authenticated

  ){

    return (

      <Navigate
        to="/login"
        replace
      />

    );

  }

  return children;

}

export default ProtectedRoute;
