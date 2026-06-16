function AuthLayout({ children }) {
  return (
    <div>

      {/* LEFT SECTION */}

      <div>

        <h1>
          Rehman Cloud
        </h1>

        <p>
          Enterprise AI Cloud Platform
        </p>

      </div>

      {/* RIGHT SECTION */}

      <div>

        {children}

      </div>

    </div>
  );
}

export default AuthLayout;
