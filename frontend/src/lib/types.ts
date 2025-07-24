  
  export interface Column {
    key: string;
    header: string;
    render?: (row: any) => React.ReactNode;
  }