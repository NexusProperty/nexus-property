import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const LandingPage = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Nexus Property
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Professional property appraisals for real estate agents and property owners.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild>
            <Link to="/login">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/demo/property-data">View Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}; 