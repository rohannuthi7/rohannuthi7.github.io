// Settings and starter notes for the guestbook tree on the home page
// (between Experience and Skills). Edit these; the component reads them.

export const wordTree = {
  /** How many of the newest notes stay on the tree. */
  capacity: 30,
  /** Longest note a visitor can leave, in characters. */
  maxLength: 50,
  /** 'christmas' is all green with a cone-shaped outline; 'fall' is gold, orange, rust and brown. */
  season: 'christmas' as 'christmas' | 'fall',
  /**
   * False until the notes database is connected. While false, a visitor's note
   * grows on their own screen only and is gone on reload, and the form says so.
   */
  saving: false,
  /** The notes the tree starts with. */
  starter: [
    'good luck this spring',
    'hello from madison',
    'this tree is cool',
    'great site',
    'go badgers',
    'good luck with recruiting',
    'this is great',
    'good luck with finals',
    'nice work',
    'great work on the tree',
    'hello from chicago',
    'this tree is so clean',
  ],
};
