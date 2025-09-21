import { useState } from "react";
import { FileCode, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function FeatureEditor() {
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

  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(featureContent);
      toast({
        title: "Copied to clipboard",
        description: "Feature file content has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([featureContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature.feature';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Feature file downloaded",
      description: "Your feature file has been saved as 'feature.feature'",
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      let className = 'text-foreground';
      
      if (trimmedLine.startsWith('Feature:')) {
        className = 'text-syntax-keyword font-semibold text-lg';
      } else if (trimmedLine.startsWith('Scenario:') || trimmedLine.startsWith('Scenario Outline:')) {
        className = 'text-syntax-scenario font-semibold';
      } else if (trimmedLine.startsWith('Background:')) {
        className = 'text-syntax-keyword font-semibold';
      } else if (trimmedLine.startsWith('Given')) {
        className = 'text-syntax-given';
      } else if (trimmedLine.startsWith('When')) {
        className = 'text-syntax-when';
      } else if (trimmedLine.startsWith('Then')) {
        className = 'text-syntax-then';
      } else if (trimmedLine.startsWith('And') || trimmedLine.startsWith('But')) {
        className = 'text-muted-foreground';
      } else if (trimmedLine.startsWith('As a') || trimmedLine.startsWith('I want') || trimmedLine.startsWith('So that')) {
        className = 'text-muted-foreground italic';
      }

      return (
        <div key={index} className={`${className} leading-relaxed`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-editor border-x border-panel-border">
      <div className="p-4 border-b border-panel-border bg-gradient-panel flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground">Feature File</h2>
            <p className="text-sm text-muted-foreground">Write your BDD scenarios using Gherkin syntax</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Textarea
          value={featureContent}
          onChange={(e) => setFeatureContent(e.target.value)}
          className="absolute inset-0 w-full h-full resize-none border-0 rounded-none focus:ring-0 font-mono text-sm leading-relaxed p-6 bg-transparent text-transparent caret-foreground selection:bg-primary/20"
          placeholder="Enter your feature file content using Gherkin syntax..."
        />
        <div className="absolute inset-0 pointer-events-none p-6 font-mono text-sm whitespace-pre-wrap overflow-hidden">
          <div className="select-none">
            {formatContent(featureContent)}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-panel-border bg-gradient-panel">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Lines: {featureContent.split('\n').length}</span>
            <span>Scenarios: {(featureContent.match(/Scenario:/g) || []).length}</span>
            <span>Steps: {(featureContent.match(/^\s*(Given|When|Then|And|But)/gm) || []).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}