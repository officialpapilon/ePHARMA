
export const APP_NAME = "e-PHARMA";


export const API_BASE_URL = 'http://192.168.100.101:8001'; 
export const numberFormat = (number: { toString: () => string }) => {
  const parts = number.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    parts[1] = parts[1].length > 2 ? parts[1].slice(0, 2) : parts[1];
  }
  return parts.join(".");
};

export const reportErrors = (
  alert: { close: () => void; showError: (arg0: string) => void },
  errorBody: {
    message: string;
    response: { status: string; data: Record<string, unknown> };
    request: never;
  }
) => {
  let message = "An unexpected error has occurred.";
  if (errorBody?.message === "canceled") {
    return alert?.close();
  }
  if (errorBody.response) {
    const statusCode = parseInt(errorBody.response.status);
    switch (statusCode) {
      case 401:
        {
          message = "Session expired. Please log in again.";
        }
        break;
      case 403:
        {
          const data = errorBody.response.data;
          if (data?.error) {
            message = data.error;
          } else {
            message = "You don't have permission to perform this action.";
          }
        }
        break;
      case 404:
        {
          message = "The requested resource could not be located.";
        }
        break;
      case 422:
        {
          const data = errorBody.response.data;
          if (data?.error) {
            message = data.error;
          } else {
            const errors: string[] = [];
            Object.keys(data || {}).forEach((e) => {
              if (data && data[e] && Array.isArray(data[e])) {
                errors.push(data[e][0]);
              }
            });
            message = errors.join("\n");
          }
        }
        break;
    }
  } else if (errorBody.request) {
    message = "Unable to connect. Please check your network.";
  }

  if (alert) {
    alert.showError(message);
  }
};


export const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Use 24-hour format
  });
};
