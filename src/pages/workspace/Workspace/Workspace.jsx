import { useEffect, useState } from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  getProjects,
  createProject,
  deployProject
} from "../../../services/projectService";

import { generateCode } from "../../../services/aiService";

import styles from "./Workspace.module.css";

function Workspace() {

  const [projects, setProjects] =
  useState([]);

  const [selectedProject,
  setSelectedProject] =
  useState(null);

  const [prompt, setPrompt] =
  useState("");

  const [loading,
  setLoading] =
  useState(false);

  const [deploying,
  setDeploying] =
  useState(false);

  const [framework,
  setFramework] =
  useState("React");

  const [generatedFiles,
  setGeneratedFiles] =
  useState([]);

  const [deploymentStatus,
  setDeploymentStatus] =
  useState("Not Deployed");

  const [liveUrl,
  setLiveUrl] =
  useState("");

  useEffect(()=>{

    loadProjects();

  },[]);

  async function loadProjects(){

    try{

      const response =
      await getProjects();

      setProjects(
        response.data || []
      );

    }

    catch(error){

      console.error(error);

    }

  }

  async function handleGenerate(){

    if(!prompt.trim()){

      alert(
        "Enter project idea"
      );

      return;

    }

    try{

      setLoading(true);

      await generateCode(
        prompt,
        framework
      );

      await createProject({

        projectName:
        prompt.substring(0,50),

        description:
        prompt,

        framework

      });

      setGeneratedFiles([
        {
          path:"App.jsx"
        },
        {
          path:"Dashboard.jsx"
        },
        {
          path:"api.js"
        }
      ]);

      await loadProjects();

    }

    catch(error){

      console.error(error);

      alert(
        error.message
      );

    }

    finally{

      setLoading(false);

    }

  }

  async function handleDeploy(){

    if(!selectedProject){

      alert(
        "Select project first"
      );

      return;

    }

    try{

      setDeploying(true);

      setDeploymentStatus(
        "Deploying..."
      );

      const response =

      await deployProject(
        selectedProject._id
      );

      setDeploymentStatus(
        "Deployed"
      );

      setLiveUrl(

        response?.deployment
        ?.liveUrl ||

        "Deployment Ready"

      );

    }

    catch(error){

      console.error(error);

      setDeploymentStatus(
        "Failed"
      );

    }

    finally{

      setDeploying(false);

    }

  }

  return (

    <DashboardLayout>

      <h1
        style={{
          color:"#fff"
        }}
      >
        Workspace V3 Loading...
      </h1>

    </DashboardLayout>

  );

}

export default Workspace;
