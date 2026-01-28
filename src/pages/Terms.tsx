import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-6 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-black tracking-tight mb-8">Terms of Service</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Catchy ("the Service"), you agree to be bound by these Terms of 
              Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Description of Service</h2>
            <p>
              Catchy is a platform that helps users transform audio recordings of conversations into 
              written content for social media. The Service includes audio transcription, insight 
              extraction, and AI-powered content generation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. User Accounts</h2>
            <p>To use the Service, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create an account with accurate information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years of age</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. User Content</h2>
            <p>
              You retain ownership of all content you upload to the Service, including audio recordings 
              and any modifications you make to generated content. By uploading content, you grant us 
              a limited license to process and store it for the purpose of providing the Service.
            </p>
            <p>You are responsible for ensuring you have the right to upload and use any content, including obtaining consent from individuals whose voices appear in recordings.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload content that violates any laws or rights of others</li>
              <li>Use the Service to generate misleading or harmful content</li>
              <li>Attempt to access other users' accounts or data</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems to access the Service without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Intellectual Property</h2>
            <p>
              The Service, including its design, features, and content (excluding user content), is 
              owned by Catchy and protected by intellectual property laws. You may not copy, modify, 
              or distribute any part of the Service without our written permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We are not liable for 
              any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes 
              by posting the new Terms on the Service. Your continued use after changes constitutes 
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@catchy.io" className="text-accent hover:underline">
                legal@catchy.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
