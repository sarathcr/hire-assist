export const DialogConfig = {
  hasBackdrop: true,
  backdropClass: 'dialogBackdrop',
  disableClose: true,
  autoFocus: false,
};

export interface DialogData {
  title?: string;
  headerTitle?: string;
  warningCount?: number;
  message: string;
  isChoice: boolean;
  acceptButtonText?: string;
  cancelButtonText?: string;
  disableClose?: boolean;
  closeOnNavigation?: boolean;
}
