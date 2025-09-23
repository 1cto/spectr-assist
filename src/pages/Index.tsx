import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { FeatureEditor } from "@/components/FeatureEditor";
import { EstimationPanel } from "@/components/EstimationPanel";
import { TipsPanel } from "@/components/TipsPanel";

const Index = () => {
  const [featureContent, setFeatureContent] = useState(`Feature: User Registration
  As a new user
  I want to create an account
  So that I can access the platform

  Background:
    Given the registration page is displayed
    And the form fields are visible

  Scenario: Successful user registration
    Given I am on the registration page
    When I enter a valid email address
    And I enter a strong password
    And I confirm the password correctly
    And I accept the terms and conditions
    And I click the "Register" button
    Then I should see a success message
    And I should receive a confirmation email
    And I should be redirected to the welcome page

  Scenario: Registration with invalid email
    Given I am on the registration page
    When I enter an invalid email address
    And I enter a valid password
    And I click the "Register" button
    Then I should see an error message "Please enter a valid email address"
    And the registration should not proceed

  Scenario: Password mismatch
    Given I am on the registration page
    When I enter a valid email address
    And I enter a password in the password field
    And I enter a different password in the confirm password field
    And I click the "Register" button
    Then I should see an error message "Passwords do not match"
    And the registration should not proceed`);
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-panel-border bg-gradient-panel px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">BA Requirements Studio</h1>
            <p className="text-sm text-muted-foreground">Collaborative feature file creation and analysis</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-estimate-low rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-80 flex-shrink-0">
        <ChatPanel 
          featureContent={featureContent} 
          onFeatureChange={setFeatureContent}
        />
        </div>

        {/* Center Panel - Feature Editor */}
        <div className="flex-1 min-w-0">
          <FeatureEditor value={featureContent} onChange={setFeatureContent} />
        </div>

        {/* Right Panel - Estimation & Tips */}
        <div className="w-80 flex-shrink-0 bg-panel border-l border-panel-border overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Estimation Panel (Upper) */}
            <div className="p-4 border-b border-panel-border">
              <EstimationPanel featureContent={featureContent} />
            </div>

            {/* Tips Panel (Lower) */}
            <div className="flex-1 p-4 overflow-auto">
              <TipsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
