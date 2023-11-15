import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function Component() {
  return (
    <main className="min-h-screen grid place-items-center">
      <Card className="max-w-[420px]">
        <CardHeader>
          <CardTitle>
            Your ip has more than 90 score in bad reputation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-8">
            This app is created as hackathon project to demonstrate the pagea
            capabilities. To show case its Ip intel service capabilities. I have
            choosen to block ipAddress with more 90 score in bad reputation.
            Therefore you will not be able to use this app.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
