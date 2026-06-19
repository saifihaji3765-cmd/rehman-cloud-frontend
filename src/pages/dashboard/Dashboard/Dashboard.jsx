import { useEffect, useState } from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";

import { useAuth } from "../../../context/AuthContext";

import {
  getProjects
} from "../../../services/workspaceService";

import {
  getSubscription
} from "../../../services/billingService";

import styles from "./Dashboard.module.css";

function Dashboard() {

  const { user } = useAuth();

  const [projects,setProjects] =
  useState([]);

  const [subscriptions,
  setSubscriptions] =
  useState([]);

  const [loading,
  setLoading] =
  useState(true);

  useEffect(()=>{

    async function loadDashboard(){

      try{

        const [

          projectsResponse,

          subscriptionResponse

        ] = await Promise.all([

          getProjects(),

          getSubscription()

        ]);

        setProjects(

          projectsResponse?.data || []

        );

        setSubscriptions(

          subscriptionResponse?.data || []

        );

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

    loadDashboard();

  },[]);

  const currentPlan =

  subscriptions[0]?.planName ||

  user?.subscriptionPlan ||

  "Free";

  return (

    <DashboardLayout>

      <div className={styles.page}>

        {/* HEADER */}

        <div className={styles.header}>

          <div>

            <h1 className={styles.title}>

              Welcome Back,
              {" "}
              {user?.name || "User"}

            </h1>

            <p className={styles.subtitle}>

              {user?.email || "Loading..."}

            </p>

          </div>

          <button
            className={styles.createButton}
          >
            New Project
          </button>

        </div>

        {/* STATS */}

        <div className={styles.statsGrid}>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Active Projects
            </div>

            <div className={styles.statValue}>

              {loading
                ? "..."
                : projects.length}

            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Deployments
            </div>

            <div className={styles.statValue}>

              {user?.deploymentsUsed || 0}

            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Current Plan
            </div>

            <div className={styles.statValue}>

              {currentPlan}

            </div>

          </div>

          <div className={styles.statCard}>

            <div className={styles.statLabel}>
              Account Role
            </div>

            <div className={styles.statValue}>

              {user?.role || "User"}

            </div>

          </div>

        </div>

        {/* PLATFORM STATUS */}

        <div className={styles.highlightCard}>

          <div className={styles.highlightTitle}>
            ZyrionOS Platform Status
          </div>

          <div className={styles.highlightValue}>
            Operational
          </div>

          <div className={styles.highlightText}>
            AI infrastructure,
            deployments,
            monitoring and cloud services
            are running normally.
          </div>

        </div>

        {/* HEALTH */}

        <div className={styles.healthGrid}>

          <div className={styles.healthCard}>

            <div className={styles.healthTitle}>
              Infrastructure
            </div>

            <div className={styles.healthValue}>
              Healthy
            </div>

          </div>

          <div className={styles.healthCard}>

            <div className={styles.healthTitle}>
              Deployments
            </div>

            <div className={styles.healthValue}>
              Stable
            </div>

          </div>

          <div className={styles.healthCard}>

            <div className={styles.healthTitle}>
              AI Services
            </div>

            <div className={styles.healthValue}>
              Active
            </div>

          </div>

        </div>

        {/* CONTENT */}

        <div className={styles.contentGrid}>

          {/* RECENT PROJECTS */}

          <div className={styles.section}>

            <h2 className={styles.sectionTitle}>
              Recent Projects
            </h2>

            {

              loading

              ? (

                <div className={styles.activityItem}>
                  Loading...
                </div>

              )

              : projects.length === 0

              ? (

                <div className={styles.activityItem}>
                  No projects created yet
                </div>

              )

              : (

                projects
                .slice(0,5)
                .map((project)=>(

                  <div
                    key={project._id}
                    className={styles.activityItem}
                  >

                    {project.projectName}

                  </div>

                ))

              )

            }

          </div>

          {/* ACCOUNT */}

          <div className={styles.section}>

            <h2 className={styles.sectionTitle}>
              Account Information
            </h2>

            <div className={styles.activityItem}>

              Name:
              {" "}
              {user?.name || "--"}

            </div>

            <div className={styles.activityItem}>

              Email:
              {" "}
              {user?.email || "--"}

            </div>

            <div className={styles.activityItem}>

              Role:
              {" "}
              {user?.role || "--"}

            </div>

            <div className={styles.activityItem}>

              Plan:
              {" "}
              {currentPlan}

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>

  );

}

export default Dashboard;
