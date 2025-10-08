import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div id="terms-page" className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          id="btn-back-to-auth"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card id="terms-card">
          <CardHeader>
            <CardTitle className="text-3xl">Terms and Conditions for StoryBot</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: August 04, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <section id="section-introduction">
              <h2>1. Introduction</h2>
              <p>
                Welcome to StoryBot ("Company", "we", "our", "us"). These Terms and Conditions ("Terms") govern your use of our website bot.storymapper.io and related services ("Service"). By accessing or using our Service, you agree to comply with these Terms. If you do not agree, you must not use our Service.
              </p>
            </section>

            <section id="section-eligibility">
              <h2>2. Eligibility</h2>
              <ul>
                <li>You must be at least 18 years old to use our Service.</li>
                <li>By using StoryBot, you confirm that you meet this requirement. If you are under 18, you may only use the Service with the consent and supervision of a parent or guardian.</li>
              </ul>
            </section>

            <section id="section-accounts">
              <h2>3. Accounts</h2>
              <ul>
                <li>You may need to create an account to access certain features.</li>
                <li>You agree to provide accurate and complete information when creating an account.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              </ul>
            </section>

            <section id="section-use-service">
              <h2>4. Use of the Service</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for unlawful or unauthorized purposes.</li>
                <li>Attempt to gain unauthorized access to our systems or data.</li>
                <li>Upload or share harmful, offensive, or infringing content.</li>
                <li>Interfere with or disrupt the security, integrity, or availability of the Service.</li>
              </ul>
              <p>Violation of these rules may result in suspension or termination of your account.</p>
            </section>

            <section id="section-intellectual-property">
              <h2>5. Intellectual Property</h2>
              <ul>
                <li>All content, features, and functionality of the Service (including text, graphics, logos, and software) are owned by StoryBot or its licensors.</li>
                <li>You are granted a limited, non-exclusive, non-transferable license to use the Service solely in accordance with these Terms.</li>
                <li>You may not copy, modify, distribute, or create derivative works without our prior written consent.</li>
              </ul>
            </section>

            <section id="section-user-content">
              <h2>6. User-Generated Content</h2>
              <ul>
                <li>You retain ownership of any content you create or upload to StoryBot.</li>
                <li>By submitting content, you grant us a non-exclusive, royalty-free, worldwide license to use, display, and store it for the purpose of providing and improving the Service.</li>
                <li>You are solely responsible for your content and ensuring it complies with applicable laws.</li>
              </ul>
            </section>

            <section id="section-payments">
              <h2>7. Payments and Subscriptions</h2>
              <ul>
                <li>Certain features may require payment or subscription.</li>
                <li>Fees are billed in advance and are non-refundable, except as required by law.</li>
                <li>We reserve the right to change prices with prior notice.</li>
              </ul>
            </section>

            <section id="section-third-party">
              <h2>8. Third-Party Services</h2>
              <ul>
                <li>The Service may include links or integrations with third-party websites or services (e.g., Google login).</li>
                <li>We are not responsible for the content, policies, or practices of third-party services.</li>
                <li>Your interactions with third parties are at your own risk.</li>
              </ul>
            </section>

            <section id="section-termination">
              <h2>9. Termination</h2>
              <ul>
                <li>We may suspend or terminate your access if you violate these Terms or misuse the Service.</li>
                <li>Upon termination, your right to use the Service ceases immediately.</li>
              </ul>
            </section>

            <section id="section-liability">
              <h2>10. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law:</p>
              <ul>
                <li>StoryBot and its affiliates shall not be liable for indirect, incidental, or consequential damages arising from your use of the Service.</li>
                <li>Our total liability for any claim will not exceed the amount you paid (if any) in the past 12 months.</li>
              </ul>
            </section>

            <section id="section-warranties">
              <h2>11. Disclaimer of Warranties</h2>
              <ul>
                <li>The Service is provided "AS IS" and "AS AVAILABLE."</li>
                <li>We do not guarantee that the Service will be uninterrupted, error-free, or secure.</li>
              </ul>
            </section>

            <section id="section-governing-law">
              <h2>12. Governing Law</h2>
              <p>These Terms are governed by the laws of Croatia, without regard to conflict of law principles.</p>
            </section>

            <section id="section-changes">
              <h2>13. Changes to These Terms</h2>
              <p>We may update these Terms from time to time. Updates will be posted on this page with a new "Last updated" date. Your continued use of the Service constitutes acceptance of the revised Terms.</p>
            </section>

            <section id="section-contact">
              <h2>14. Contact Us</h2>
              <p>If you have any questions about these Terms, you can contact us: adv@storymapper.io</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
