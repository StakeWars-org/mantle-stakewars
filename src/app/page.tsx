import { WalletConnect } from "@/components/wallet-connect";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stake Wars Mantle</h1>
        <WalletConnect />
      </div>
    </div>
  );
}
