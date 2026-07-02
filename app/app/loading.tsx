import { Card, CardContent } from "@/components/ui/card";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-md bg-muted" />
        <div className="h-9 w-full max-w-xl rounded-md bg-muted" />
        <div className="h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-3 p-5">
              <div className="size-10 rounded-md bg-muted" />
              <div className="h-4 w-20 rounded-md bg-muted" />
              <div className="h-7 w-28 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
