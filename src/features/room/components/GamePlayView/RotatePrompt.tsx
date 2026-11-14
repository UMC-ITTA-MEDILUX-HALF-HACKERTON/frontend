import { Button } from "@common/components/Button";
import { PageHeader } from "@common/components/PageHeader/PageHeader";
import { btn } from "@common/utils/button-class";

// S-003a' 폰을 가로로 돌려 달라는 안내. 가로로 돌리면 바로 게임이 열리고, 세로로 하고 싶으면 아래 버튼을 누른다.
export function RotatePrompt({
  onBack,
  onStayPortrait,
}: {
  onBack: () => void;
  onStayPortrait: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="지각비 게임" onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div
          aria-hidden
          className="relative h-[104px] w-[62px] rounded-[14px] border-[3px] border-[#151a24]"
        >
          <span className="absolute bottom-1.5 left-1/2 h-1 w-3.5 -translate-x-1/2 rounded-full bg-[#151a24]" />
        </div>
        <h2 className="mt-7 text-[22px] font-black text-[#151a24]">폰을 가로로 돌려 주세요</h2>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#6b7385]">
          가로로 돌리면 바로 게임 화면이 열려요
          <br />
          세로 고정이 켜져 있다면 잠깐 꺼 주세요
        </p>
      </div>
      <div className="px-5 pt-3 pb-6">
        <Button className={btn({ size: "lg", full: true, tone: "fill" })} onClick={onStayPortrait}>
          세로로 그냥 할래요
        </Button>
      </div>
    </div>
  );
}
