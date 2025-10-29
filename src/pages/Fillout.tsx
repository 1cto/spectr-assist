import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import logo from "@/assets/logo.svg";

const Fillout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Fillout messages
    const handleFilloutMessage = (event: MessageEvent) => {
      if (typeof event.data === "string" && event.data.includes("fillout:close")) {
        console.log("[Fillout] Form closed or completed, redirecting to home");
        localStorage.setItem("hasCompletedFillout", "true");
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("message", handleFilloutMessage);

    // Auto-click the fillout button after script loads
    const timer = setTimeout(() => {
      const filloutButton = document.getElementById("fillout-trigger-button") as HTMLElement;
      if (filloutButton) {
        console.log("[Fillout] Auto-clicking fillout button");
        filloutButton.click();
      }
    }, 1000);

    return () => {
      window.removeEventListener("message", handleFilloutMessage);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <AuthGuard>
      <div className="h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <img src={logo} alt="BA Requirements Studio" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Welcome!</h1>
          <p className="text-muted-foreground">Please complete this quick form to get started</p>
        </div>

        <div
          id="fillout-trigger-button"
          data-fillout-id="sJasutqxqKus"
          data-fillout-embed-type="popup"
          data-fillout-dynamic-resize
          data-fillout-button-color="#51E6AA"
          data-fillout-inherit-parameters
          data-fillout-popup-size="medium"
          style={{
            position: "fixed",
            zIndex: 9999,
            bottom: "20px",
            left: "20px",
            display: "block",
          }}
        >
          Open form
        </div>
      </div>
    </AuthGuard>
  );
};

export default Fillout;
