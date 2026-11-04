export type Status = 'Pilne' | 'W trakcie' | 'Rozwiazane';

export interface Rozmowa {
  id: string;
  idRozmowy: string;
  imieNazwisko: string;
  nrTelefonu: string;
  specjalista: string;
  temat: string;
  status: Status;
  dataPołączenia: string;
  czasTrwania: number;
  skrot: string;
  sugerowaneAkcje: string;
  linkTranskrypcji: string;
  dataPrzejecia: string | null;
  notatkiKonsultanta: string;
  przypisanyKonsultant: string;
  dataZamkniecia: string | null;
  rozwiazaneBezCzlowieka: boolean;
  czasReakcji: number | null;
  czasRozwiazania: number | null;
}

export interface PatchPayload {
  status?: Status;
  nowaNotatka?: string;
  autor?: string;
}
