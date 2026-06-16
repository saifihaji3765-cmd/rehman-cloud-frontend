function DashboardLayout({ children }) {
  return (
    <div>

      {/* SIDEBAR */}

      <aside>

        <h2>
          Platform
        </h2>

      </aside>

      {/* MAIN */}

      <main>

        {children}

      </main>

    </div>
  );
}

export default DashboardLayout;
