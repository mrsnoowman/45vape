import { Suspense } from "react";
import AdminOrdersPage from "./OrdersClient";
import { PageLoading } from "@/components/PageLoading";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading label="Memuat pesanan" variant="orders" />}>
      <AdminOrdersPage />
    </Suspense>
  );
}
