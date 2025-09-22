import { useState, useEffect } from "react";
import { FileCode, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import hljs from 'highlight.js/lib/core';
import gherkin from 'highlight.js/lib/languages/gherkin';

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

  useEffect(() => {
    hljs.registerLanguage('gherkin', gherkin);
  }, []);

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

  const getHighlightedContent = (content: string) => {
    try {
      // Register Gherkin language if not already registered
      if (!hljs.getLanguage('gherkin')) {
        hljs.registerLanguage('gherkin', gherkin);
      }
      
      const highlighted = hljs.highlight(content, { language: 'gherkin' });
      return highlighted.value;
    } catch (error) {
      console.warn('Highlighting failed, using custom highlighting:', error);
      // Fallback to custom highlighting if hljs fails
      return customHighlight(content);
    }
  };

  const customHighlight = (content: string) => {
    return content
      .split('\n')
      .map(line => {
        const trimmedLine = line.trim();
        let highlightedLine = line;
        
        if (trimmedLine.startsWith('Feature:')) {
          highlightedLine = line.replace(/Feature:/, '<span class="hljs-title">Feature:</span>');
        } else if (trimmedLine.startsWith('Scenario:') || trimmedLine.startsWith('Scenario Outline:')) {
          highlightedLine = line.replace(/(Scenario.*?:)/, '<span class="hljs-meta">$1</span>');
        } else if (trimmedLine.startsWith('Background:')) {
          highlightedLine = line.replace(/Background:/, '<span class="hljs-keyword">Background:</span>');
        } else if (trimmedLine.startsWith('Given')) {
          highlightedLine = line.replace(/Given/, '<span class="hljs-built_in">Given</span>');
        } else if (trimmedLine.startsWith('When')) {
          highlightedLine = line.replace(/When/, '<span class="hljs-name">When</span>');
        } else if (trimmedLine.startsWith('Then')) {
          highlightedLine = line.replace(/Then/, '<span class="hljs-function">Then</span>');
        } else if (trimmedLine.startsWith('And')) {
          highlightedLine = line.replace(/And/, '<span class="hljs-keyword">And</span>');
        } else if (trimmedLine.startsWith('But')) {
          highlightedLine = line.replace(/But/, '<span class="hljs-keyword">But</span>');
        } else if (trimmedLine.startsWith('As a') || trimmedLine.startsWith('I want') || trimmedLine.startsWith('So that')) {
          highlightedLine = `<span class="hljs-comment">${line}</span>`;
        }
        
        // Highlight strings in quotes
        highlightedLine = highlightedLine.replace(/"([^"]*)"/g, '<span class="hljs-string">"$1"</span>');
        
        return highlightedLine;
      })
      .join('\n');
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

      <div className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <Textarea
            value={featureContent}
            onChange={(e) => setFeatureContent(e.target.value)}
            className="w-full h-full resize-none border-0 rounded-none focus:ring-0 font-mono text-sm leading-relaxed p-6 bg-transparent text-transparent caret-foreground selection:bg-primary/20 overflow-auto"
            placeholder="Enter your feature file content using Gherkin syntax..."
          />
          <div className="absolute inset-0 pointer-events-none p-6 font-mono text-sm whitespace-pre-wrap overflow-auto">
            <div 
              className="select-none leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: getHighlightedContent(featureContent) 
              }}
            />
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