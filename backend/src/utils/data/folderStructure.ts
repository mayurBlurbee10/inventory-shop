export interface FolderChild {
  id: string;
  title: string;
}

export interface FolderItem {
  id: number;
  title: string;
  children: FolderChild[];
}

export const checklistFolders: FolderItem[] = [
  {
    id: 1,
    title: "Document Type One",
    children: [
      {
        id: "1.1",
        title: "Required Document One"
      },
    ],
  },
  {
    id: 2,
    title: "Document Type Two",
    children: [
      {
        id: "2.1",
        title: "Required Document Two",
      },
    ],
  },
  {
    id: 3,
    title: "Document Type Three",
    children: [
      {
        id: "3.1",
        title: "Required Document Three",
      },
    ],
  },
  {
    id: 4,
    title: "Document Type Four",
    children: [
      {
        id: "4.1",
        title: "Required Document Four",
      },
    ],
  },
  {
    id: 5,
    title: "Document Type Five",
    children: [
      {
        id: "5.1",
        title: "Required Document Five",
      },
    ],
  },
  {
    id: 6,
    title: "Document Type Six",
    children: [
      {
        id: "6.1",
        title: "Required Document Six",
      },
    ],
  },
  {
    id: 7,
    title: "Document Type Seven",
    children: [
      {
        id: "7.1",
        title: "Required Document Seven",
      },
    ],
  },
  {
    id: 8,
    title: "Document Type Eight",
    children: [
      {
        id: "8.1",
        title: "Required Document Eight",
      },
    ],
  },
  {
    id: 9,
    title: "Document Type Nine",
    children: [
      {
        id: "9.1",
        title: "Required Document Nine",
      }
    ],
  },
];

