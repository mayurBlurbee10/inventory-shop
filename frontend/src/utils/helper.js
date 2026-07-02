import moment from "moment";

export const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Handle different timestamp formats from database
      let utcDate;
      
      // Check if it's an ISO string with Z (UTC)
      if (dateString.includes('T') && dateString.includes('Z')) {
        utcDate = moment.utc(dateString);
      } 
      // Check if it's a datetime string without timezone (from MSSQL)
      else if (dateString.includes('T') || dateString.includes(' ')) {
        // Assume it's UTC if no timezone specified
        utcDate = moment.utc(dateString);
      } 
      // Fallback to standard parsing
      else {
        utcDate = moment.utc(dateString);
      }
      
      // Convert to IST for display (UTC+5:30)
      const istDate = utcDate.utcOffset(330);
      const now = moment().utcOffset(330);
      
      // Check if the message is very recent (within 30 seconds)
      const diffInSeconds = now.diff(istDate, 'seconds');
      if (diffInSeconds >= 0 && diffInSeconds <= 60) {
        return "just now";
      }
      
      return istDate.fromNow();
    } catch (error) {
      console.error('Error formatting time ago:', error, 'Input:', dateString);
      return "";
    }
  };

  export function getUserInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase();
  }