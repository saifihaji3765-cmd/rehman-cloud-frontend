import DashboardLayout from "../../../layouts/DashboardLayout/DashboardLayout.jsx";
import styles from "./Billing.module.css";

function Billing() {

  const currentPlan = {
    name: "Enterprise",
    monthlyPrice: 299,
    currency: "USD",

    infrastructure: {
      ram: "64GB",
      cpu: "16 vCPU",
      storage: "1TB",
      bandwidth: "Unlimited"
    },

    support:
      "Dedicated Success Manager"
  };

  return (
    <DashboardLayout>

      <div className={styles.page}>

        {/* HEADER */}

        <div className={styles.header}>

          <div>

            <h1 className={styles.title}>
              Billing & Subscription
            </h1>

            <p className={styles.subtitle}>
              Manage plans, infrastructure
              and billing information.
            </p>

          </div>

          <button
            className={styles.upgradeButton}
          >
            Manage Subscription
          </button>

        </div>

        {/* PLAN CARD */}

        <div className={styles.planCard}>

          <div className={styles.planName}>
            {currentPlan.name}
          </div>

          <div className={styles.planPrice}>
            ${currentPlan.monthlyPrice}/mo
          </div>

          <p className={styles.planDescription}>
            {currentPlan.support}
          </p>

        </div>

        {/* INFRASTRUCTURE */}

        <div className={styles.statsGrid}>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              RAM
            </div>

            <div className={styles.statValue}>
              {currentPlan.infrastructure.ram}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              CPU
            </div>

            <div className={styles.statValue}>
              {currentPlan.infrastructure.cpu}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Storage
            </div>

            <div className={styles.statValue}>
              {currentPlan.infrastructure.storage}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>
              Bandwidth
            </div>

            <div className={styles.statValue}>
              {currentPlan.infrastructure.bandwidth}
            </div>
          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default Billing;
