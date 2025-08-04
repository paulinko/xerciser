import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Credits = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mx-auto bg-card text-card-foreground p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Sound Effect Credits</h1>

        <div className="space-y-4 text-center">
          <p className="text-lg">
            Workout End Sound Effect by{" "}
            <a
              href="https://pixabay.com/de/users/u_2gxydaiwcd-46893983/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340660"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              u_2gxydaiwcd
            </a>{" "}
            from{" "}
            <a
              href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=340660"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Pixabay
            </a>
          </p>

          <p className="text-lg">
            Rest Sound Effect by{" "}
            <a
              href="https://pixabay.com/de/users/stu9-50616646/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=356833"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              P F
            </a>{" "}
            from{" "}
            <a
              href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=356833"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Pixabay
            </a>
          </p>

          <p className="text-lg">
            Countdown Sound Effect by{" "}
            <a
              href="https://pixabay.com/de/users/van_wiese-19197905/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=298405"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              van_Wiese
            </a>{" "}
            from{" "}
            <a
              href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=298405"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Pixabay
            </a>
          </p>
        </div>

        <p className="text-lg text-center mt-6 font-semibold">
          Created with Dyad and Gemini
        </p>
        <p className="text-lg text-center mt-2 ">
          Check out the project on{" "}
          <a
            href="https://github.com/paulinko/xerciser"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline"
          >
            GitHub
          </a>
        </p>

        <div className="mt-8 text-center">
          <Link to="/">
            <Button variant="outline" className="flex items-center mx-auto">
              <ArrowLeft size={20} className="mr-2" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Credits;