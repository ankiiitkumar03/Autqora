import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { ProjectPlanEditor } from "@/components/site/project-plan-editor";

export const metadata: Metadata = {
  title: "Implementation Plan",
  description: "Review and edit an automation project implementation plan.",
};

export default async function ProjectPlanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen pt-28 sm:pt-36">
        <ProjectPlanEditor projectId={projectId} />
      </main>
      <SiteFooter />
    </>
  );
}
