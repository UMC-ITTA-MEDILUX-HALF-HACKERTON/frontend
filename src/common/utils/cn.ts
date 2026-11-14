/** falsy 값을 걸러내고 클래스 이름을 공백으로 잇는다. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
