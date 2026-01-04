import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Home</CardTitle>
          <CardDescription>Home</CardDescription>
        </CardHeader>
        <CardContent>
          <CardDescription>Home</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
