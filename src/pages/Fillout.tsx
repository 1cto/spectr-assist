import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";
import logo from "@/assets/logo.svg";
import { FilloutPopupEmbed } from "@fillout/react";

const Fillout = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="h-screen bg-background flex flex-col">
      <header className="bg-gradient-panel px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={logo} alt="StoryBot" className="h-8 sm:h-12" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block max-w-[300px]">
                Transform Natural Language Tasks into Structured Given-When-Then Statements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-estimate-low rounded-full"></div>
              <span className="hidden sm:inline">Ready</span>
            </div>
          </div>
        </div>
      </header>

      <div className="h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Welcome!</h1>
          <p className="text-muted-foreground">Please complete this quick form to get started</p>
        </div>
        <button onClick={() => setIsOpen(true)}>Questions</button>

        <FilloutPopupEmbed
          filloutId="sJasutqxqKus"
          inheritParameters
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />

        <button
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
            top: "80px",
            left: "20px",
            display: "block",
          }}
        >
          Open form
        </button>
      </div>
    </div>
  );
};

export default Fillout;
