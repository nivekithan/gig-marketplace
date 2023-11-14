import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { TextTitle } from "~/components/ui/text";

export default function Component() {
  return (
    <div className="w-[720px] flex flex-col gap-y-6">
      <TextTitle>Credits</TextTitle>

      <Alert className="flex flex-col gap-y-2">
        <AlertTitle className="font-semibold tracking-tight flex gap-x-2">
          <AlertCircle className="w-4 h-4" />
          Do not put your actual credit card number
        </AlertTitle>
        <AlertDescription>
          This website is created for a hackathon to showcase Pangea
          capabilities in a product. We don't take or give actual money.
          Therefore you can put any credit number in below field and the
          transaction will succeed
        </AlertDescription>
      </Alert>

      <h1 className="font-semibold">Remaining Credits: </h1>
    </div>
  );
}
