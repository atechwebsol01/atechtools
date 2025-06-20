import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="glass-card p-8 rounded-xl max-w-md w-full">
        <h1 className="text-5xl font-bold text-gradient-purple-blue mb-6">404</h1>
        <p className="text-xl text-white mb-8">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="btn-gradient-primary">Return to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;