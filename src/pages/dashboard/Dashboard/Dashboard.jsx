import { useEffect, useState } from "react";

import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import { useAuth } from "../../../context/AuthContext";

import { getProjects } from "../../../services/workspaceService";
import { getSubscription } from "../../../services/billingService";

import styles from "./Dashboard.module.css";

function Dashboard() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [projectsResponse, subscriptionResponse] =
          await Promise.all([
            getProjects(),
            getSubscription()
          ]);

        console.log(
          "Dashboard Projects Response:",
          projectsResponse
        );

        console.log(
          "Dashboard Subscription Response:",
          subscriptionResponse
        );

        if (!mounted) {
          return;
        }

        /*
        ========================================
        PROJECT RESPONSE NORMALIZATION
        ========================================
        */

        const projectsData =
          projectsResponse?.data;

        let normalizedProjects = [];

        if (Array.isArray(projectsData)) {
          normalizedProjects = projectsData;
        } else if (
          Array.isArray(projectsData?.projects)
        ) {
          normalizedProjects = projectsData.projects;
        } else if (
          Array.isArray(projectsData?.data)
        ) {
          normalizedProjects = projectsData.data;
        }

        /*
        ========================================
        SUBSCRIPTION RESPONSE NORMALIZATION
        ========================================
        */

        const subscriptionData =
          subscriptionResponse?.data;

        let normalizedSubscriptions = [];

        if (Array.isArray(subscriptionData)) {
          normalizedSubscriptions = subscriptionData;
        } else if (
          Array.isArray(subscriptionData?.subscriptions)
        ) {
          normalizedSubscriptions =
            subscriptionData.subscriptions;
        } else if (
          Array.isArray(subscriptionData?.data)
        ) {
          normalizedSubscriptions =
            subscriptionData.data;
        }

        setProjects(normalizedProjects);
        setSubscriptions(normalizedSubscriptions);
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        /*
        Dashboard API fail hone par
        dashboard blank nahi hoga.
        */

        if (mounted) {
          setProjects([]);
          setSubscriptions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  ========================================
  CURRENT PLAN
  ========================================
  */

  const currentPlan =
    subscriptions[0]?.planName ||
    subscriptions[0]?.plan ||
    user?.subscriptionPlan ||
    "Free";

  /*
  ========================================
  SAFE USER DATA
  ========================================
  */

  const userName =
    user?.name || "User";

  const userEmail =
    user?.email || "Loading...";

  const userRole =
    user?.role || "User";

  const deploymentsUsed =
    Number(user?.deploymentsUsed) || 0;

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* HEADER */}

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Welcome Back, {userName}
            </h1>

            <p className={styles.subtitle}>
              {userEmail}
            </p>
          </div>

          <button
            type="button"
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
              {loading ? "..." : projects.length}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Deployments
            </div>

            <div className={styles.statValue}>
              {deploymentsUsed}
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
              {userRole}
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
            AI infrastructure, deployments,
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

            {loading ? (
              <div className={styles.activityItem}>
                Loading...
              </div>
            ) : projects.length === 0 ? (
              <div className={styles.activityItem}>
                No projects created yet
              </div>
            ) : (
              projects
                .slice(0, 5)
                .map((project, index) => (
                  <div
                    key={
                      project?._id ||
                      project?.id ||
                      index
                    }
                    className={styles.activityItem}
                  >
                    {project?.projectName ||
                      project?.name ||
                      "Unnamed Project"}
                  </div>
                ))
            )}

          </div>

          {/* ACCOUNT */}

          <div className={styles.section}>

            <h2 className={styles.sectionTitle}>
              Account Information
            </h2>

            <div className={styles.activityItem}>
              Name: {userName}
            </div>

            <div className={styles.activityItem}>
              Email: {userEmail}
            </div>

            <div className={styles.activityItem}>
              Role: {userRole}
            </div>

            <div className={styles.activityItem}>
              Plan: {currentPlan}
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
