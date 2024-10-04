export default function Appbar() {
  return (<div className="font-normal theme-border border-b  sticky top-0 z-10">
      <div className="bg-background h-14 flex items-center z-50 px-4">
        <div className="mx-auto max-w-7xl w-full">
          <a className="flex items-center gap-2" href={"/"}>
          <h3 className="text-md font-medium tracking-tight font-pixel">
            Pixel Art Maker
          </h3>
        </a>
        </div>
      </div>
    </div>)
}