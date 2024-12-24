export const DialogConfig = {
  hasBackdrop: true,
  backdropClass: 'dialogBackdrop',
  disableClose: true,
  autoFocus: false,
};

export interface DialogData {
  title: string;
  message: string;
  isChoice: boolean;
  acceptButtonText?: string;
  cancelButtonText?: string;
  disableClose?: boolean;
}
