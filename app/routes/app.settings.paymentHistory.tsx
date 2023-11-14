import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import format from "date-fns/format";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TextTitle } from "~/components/ui/text";
import {
  ClientPaymentHistoryRow,
  getPaymentHistoryForUser,
} from "~/models/paymentHistory.server";
import { requireUser } from "~/session";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const paymentHistory = await getPaymentHistoryForUser({ userId });

  return json({ paymentHistory });
}
export default function Component() {
  const { paymentHistory } = useLoaderData<typeof loader>();

  return paymentHistory.length === 0 ? (
    <PaymentHistoryEmptyState />
  ) : (
    <PaymentHistory paymentHistory={paymentHistory} />
  );
}

function PaymentHistoryEmptyState() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3">
        <TextTitle>Your payment history is empty</TextTitle>
        <p>Click below to start adding / withdrawing your credits</p>
      </div>
      <div>
        <Button asChild>
          <Link to="/app/settings/credits">Buy / Withdraw credits</Link>
        </Button>
      </div>
    </div>
  );
}

function PaymentHistory({
  paymentHistory,
}: {
  paymentHistory: ClientPaymentHistoryRow[];
}) {
  return (
    <div className="flex flex-col gap-y-6 w-[720px]">
      <TextTitle>Payment History</TextTitle>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment Id</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentHistory.map((paymentHistory) => {
            return (
              <TableRow key={paymentHistory.id}>
                <TableCell>{paymentHistory.id}</TableCell>
                <TableCell>
                  {paymentHistory.orderType === "add"
                    ? "Add credits"
                    : "Withdraw credits"}
                </TableCell>
                <TableCell>$ {paymentHistory.orderValue}</TableCell>
                <TableCell>
                  {format(
                    new Date(paymentHistory.createdAt),
                    "uuuu-MM-dd KK:mm aaa",
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
