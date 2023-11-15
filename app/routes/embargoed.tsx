import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function Component() {
  return (
    <main className="min-h-screen grid place-items-center">
      <Card className="max-w-[420px]">
        <CardHeader>
          <CardTitle>It seems you are from North Korea</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-8">
            This app is created as hackathon project to demonstrate the pagea
            capabilities. To show case its Embargo service capabilities. I have
            choosen North Korea as country to get embargoed. Therefore you will
            not be able to use this app. Sorry
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
