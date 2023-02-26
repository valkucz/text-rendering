export enum MoveDirection {
  Forward,
  Backward,
  Left,
  Right,
  None,
}

export function mapKeyToMoveDirection(key: string): MoveDirection {
    switch(key){
        case 'ArrowUp':
        case 'w':
            return MoveDirection.Forward;
        case 'ArrowDown':
        case 's':
            return MoveDirection.Backward;
        case 'ArrowLeft':
        case 'a':
            return MoveDirection.Left;
        case 'ArrowRight':
        case 'd':
            return MoveDirection.Right;
        default:
            return MoveDirection.None;
    }
}