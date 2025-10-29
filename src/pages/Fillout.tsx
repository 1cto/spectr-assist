import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";
import logo from "@/assets/logo.svg";
import { FilloutPopupEmbed } from "@fillout/react";

const Fillout = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {
    // 2. Add an extra useEffect to ensure the state is set to true
    //    even if the initial state somehow gets overridden before the render cycle.
    //    (Though setting it to 'true' in useState is usually sufficient).
    //    This can be safely removed or kept simple:
    if (isOpen === false) {
      setIsOpen(true);
    }
    // Handle Fillout messages
    const handleFilloutMessage = (event: MessageEvent) => {
      // The @fillout/react component manages its own closure, but we keep this
      // for the external window message that Fillout sends upon completion/closure.
      if (typeof event.data === "string" && event.data.includes("fillout:close")) {
        console.log("[Fillout] Form closed or completed, redirecting to home");
        localStorage.setItem("hasCompletedFillout", "true");
        // We close the local state before navigating to prevent double render issues
        setIsOpen(false);
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("message", handleFilloutMessage);

    // ⚠️ Removed the manual setTimeout/click logic, as it's not needed
    // when using the FilloutPopupEmbed component with isOpen={true}.

    return () => {
      window.removeEventListener("message", handleFilloutMessage);
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
        <div>
          <button onClick={() => setIsOpen(true)}>Open form</button>

          <FilloutPopupEmbed
            filloutId="sJasutqxqKus"
            inheritParameters
            isOpen={isOpen}
            onClose={() => {setIsOpen(false);
                            localStorage.setItem("hasCompletedFillout", "true");
                            navigate("/", { replace: true });
                           }
          />
        </div>
      </div>
    </div>
  );
};

export default Fillout;
