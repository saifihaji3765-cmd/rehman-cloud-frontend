import { useEffect, useState } from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import {
  getProjects,
  createProject,
  deployProject
} from "../../../services/workspaceService";

import { generateCode }
from "../../../services/aiService";

import styles from "./Workspace.module.css";

function Workspace() {

  const [projects,setProjects] =
  useState([]);

  const [selectedProject,
  setSelectedProject] =
  useState(null);

  const [prompt,setPrompt] =
  useState("");

  const [loading,setLoading] =
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
  useState("Waiting For Deployment");

  const [liveUrl,
  setLiveUrl] =
  useState("");
 const [aiResponse,
setAiResponse] =
useState("");

const [selectedFile,
setSelectedFile] =
useState(null);
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
        "Enter project idea first"
      );

      return;

    }

    try{

      setLoading(true);

      const aiResult =

await generateCode(
  prompt,
  framework
);

setAiResponse(

  JSON.stringify(
    aiResult,
    null,
    2
  )

);

      await createProject({

        projectName:
        prompt.substring(0,50),

        description:
        prompt,

        framework

      });

      setGeneratedFiles([
        { path:"App.jsx" },
        { path:"Dashboard.jsx" },
        { path:"Workspace.jsx" },
        { path:"api.js" }
      ]);

      await loadProjects();

      setPrompt("");

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

      <div className={styles.page}>

        {/* LEFT */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <h2 className={styles.panelTitle}>
              Projects
            </h2>

          </div>

          <div className={styles.history}>

            {

              projects.length > 0

              ?

              projects.map((project)=>(

                <div

                  key={project._id}

                  className={
                    styles.historyItem
                  }

                  onClick={()=>{

                    setSelectedProject(
                      project
                    );

                  }}

                >

                  {project.projectName}

                </div>

              ))

              :

              <div
                className={
                  styles.historyItem
                }
              >
                No Projects Yet
              </div>

            }

          </div>

        </div>

        {/* CENTER */}

        <div className={styles.panel}>

          <div className={styles.chatArea}>

            <div className={styles.messages}>

              <div
                className={`${styles.message} ${styles.ai}`}
              >

                Describe your SaaS,
                AI Product,
                Automation System,
                Startup Idea
                or Business Platform.

                ZyrionOS will help
                generate the project
                architecture and
                deployment workflow.

              </div>
            {
  aiResponse && (

    <div
      className={`${styles.message} ${styles.ai}`}
    >

      <h3>
        AI Generated Output
      </h3>

      <pre
        style={{
          whiteSpace:"pre-wrap",
          overflow:"auto"
        }}
      >
        {aiResponse}
      </pre>

    </div>

  )
}
            </div>

            <div className={styles.inputArea}>

              <textarea

                value={prompt}

                onChange={(e)=>{

                  setPrompt(
                    e.target.value
                  );

                }}

                className={
                  styles.textarea
                }

                placeholder="Describe what you want to build..."

              />

              <div className={styles.actions}>

                <button

                  onClick={
                    handleGenerate
                  }

                  disabled={loading}

                  className={
                    styles.generateButton
                  }

                >

                  {

                    loading

                    ?

                    "Generating..."

                    :

                    "Generate Project"

                  }

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className={styles.panel}>

          <div className={styles.panelHeader}>

            <h2 className={styles.panelTitle}>
              Project Overview
            </h2>

          </div>

          <div className={styles.sidebar}>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Generated Files
              </div>

              <div className={styles.fileList}>

                {

                  generatedFiles.map(

                    (file,index)=>(

                      <div
  key={index}
  className={styles.fileItem}
  onClick={()=>{
    setSelectedFile(file);
  }}
>
  {file.path}
</div>

                    )

                  )

                }

              </div>

            </div>
            <div className={styles.card}>

  <div className={styles.cardTitle}>
    File Preview
  </div>

  <div className={styles.cardText}>

    {

      selectedFile

      ?

      selectedFile.path

      :

      "Select file to preview"

    }

  </div>

</div>
            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Deployment Status
              </div>

              <div
                className={
                  deploymentStatus ===
                  "Deployed"

                  ?

                  styles.statusReady

                  :

                  styles.statusPending
                }
              >

                {deploymentStatus}

              </div>

            </div>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Framework
              </div>

              <div className={styles.cardText}>
                {framework}
              </div>

            </div>

            <div className={styles.card}>

              <div className={styles.cardTitle}>
                Live URL
              </div>

              <div className={styles.liveUrl}>

                {

                  liveUrl ||

                  "Available After Deployment"

                }

              </div>

            </div>

            <div className={styles.card}>

              <button

                disabled={deploying}

                onClick={
                  handleDeploy
                }

                className={
                  styles.deployButton
                }

              >

                {

                  deploying

                  ?

                  "Deploying..."

                  :

                  "Deploy Project"

                }

              </button>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>

  );

}

export default Workspace;
