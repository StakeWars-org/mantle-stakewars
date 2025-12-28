import { GameRoomDocument } from "@/store/useOnlineGame";
import { Progress } from "@/components/ui/progress";
import { compactHash } from "@/components/ConnectButton";
import PlayerAbility from "./PlayerAbility";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export default function PlayerHealth({
  gameState,
}: {
  gameState?: GameRoomDocument["gameState"];
}) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';
  
  const isPlayer1 = gameState?.player1.id === walletAddress;
  const isPlayer2 = gameState?.player2.id === walletAddress;

  const currentPlayer = isPlayer1 
    ? gameState?.player1 
    : isPlayer2 
      ? gameState?.player2 
      : null;

  const healthPercentage = currentPlayer?.currentHealth
    ? Math.max(
        0,
        Math.min(
          100,
          (currentPlayer.currentHealth /
            (currentPlayer.character?.baseHealth || 100)) *
            100
        )
      )
    : 0;

  return (
    <div>
      <div className="bg-[#3F3F3F] bg-cover min-h-[129px] lg:h-[267px] rounded-[5px] lg:rounded-[10px] flex justify-between gap-8 items-center px-6 py-2 w-full overflow-auto">
      <div
        className={`flex flex-col rounded-[6px] relative justify-end items-center w-[63px] lg:w-[132px] h-[97px] lg:h-[195px] p-4 overflow-hidden outline-1 outline-[#E8E8E8] outline-offset-[6px] shadow-[0px_4px_7.2px_3px_rgba(191,229,40,0.39)]`}
      >
        <div
          className={`absolute -z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full`}
        >
          <img
            className={`border-5 border-black h-full w-full rounded-[6px]`}
            src={`/custom-assets/characters/${currentPlayer?.character?.id}.png`}
            alt={currentPlayer?.character?.nickname}
          />
        </div>
      </div>

      <div className="flex gap-[7px] flex-col w-5/6 ">
        {/* Stamina Display */}
        {gameState?.gameStatus === 'inProgress' && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#BFE528] text-xs font-semibold">Stamina</span>
              <span className="text-white text-xs">{currentPlayer?.stamina || 0}/100</span>
            </div>
            <div className="bg-[#494949] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  (currentPlayer?.stamina || 0) >= 50 
                    ? 'bg-green-500' 
                    : (currentPlayer?.stamina || 0) >= 30 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
                style={{ width: `${((currentPlayer?.stamina || 0) / 100) * 100}%` }}
              />
            </div>
          </div>
        )}

        <PlayerAbility
          gameState={gameState}
          userId={currentPlayer?.id as string}
        />

        {currentPlayer?.activeBuffs?.length as number > 0 && (
          <div>
            <span className="text-[#BFE528] text-xs my-3">Active power up</span>
            <div className=" flex items-center flex-wrap gap-2 my-2">
              {currentPlayer?.activeBuffs?.map((powerup, index) => (
              <div key={index} className="border-[0.7px] py-1 px-3 text-white text-xs border-white bg-[#BFE52833] rounded-lg w-fit">
                {powerup.name}(+{powerup.effect}): {powerup.remainingTurns} 
              </div>
            ))}
            </div>
          </div>
        )}

        <div className="space-y-[7px] flex-col hidden lg:block">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold">
            <span className="text-[#BFE528]">Clan :</span>{" "}
            {currentPlayer?.character?.nickname || "Opponent"}
          </span>
          <span className="text-[15px]">
            {compactHash(currentPlayer?.id || "") || "Opponent"}
          </span>
        </div>
        <div className="bg-[#494949] p-[12px] rounded-[10px]">
          <Progress
            className="!h-1.5 !rounded-[10px]"
            value={healthPercentage}
          />
        </div>
        </div>
      </div>
    </div>

      <div className="space-y-[7px] flex-col block lg:hidden mt-5">
        <div className="flex justify-between items-center">
          <span className="text-[15px] font-bold">
            <span className="text-[#BFE528]">Clan :</span>{" "}
            {currentPlayer?.character?.nickname || "Opponent"}
          </span>
          <span className="text-[15px]">
            {compactHash(currentPlayer?.id || "") || "Opponent"}
          </span>
        </div>
        <div className="bg-[#494949] p-[12px] rounded-[10px]">
          <Progress
            className="!h-1.5 !rounded-[10px]"
            value={healthPercentage}
          />
        </div>
        {/* Stamina Display */}
        {gameState?.gameStatus === 'inProgress' && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#BFE528] text-xs font-semibold">Stamina</span>
              <span className="text-white text-xs">{currentPlayer?.stamina || 0}/100</span>
            </div>
            <div className="bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (currentPlayer?.stamina || 0) >= 50 
                    ? 'bg-green-500' 
                    : (currentPlayer?.stamina || 0) >= 30 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
                style={{ width: `${((currentPlayer?.stamina || 0) / 100) * 100}%` }}
              />
            </div>
          </div>
        )}
        </div>
    </div>
    
  );
}
