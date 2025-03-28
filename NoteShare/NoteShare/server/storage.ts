import { 
  User, InsertUser, Note, InsertNote, 
  Comment, InsertComment, Download, InsertDownload, 
  Like, InsertLike, Discussion, InsertDiscussion,
  DiscussionReply, InsertDiscussionReply,
  Follow, InsertFollow, users, notes 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(userId: number, coins: number): Promise<User>;
  getTopContributors(limit: number): Promise<User[]>;
  
  // Note methods
  createNote(note: InsertNote): Promise<Note>;
  getNoteById(id: number): Promise<Note | undefined>;
  getNotesByUserId(userId: number): Promise<Note[]>;
  searchNotes(query: string): Promise<Note[]>;
  getAllNotes(page: number, limit: number): Promise<Note[]>;
  getTrendingNotes(limit: number): Promise<Note[]>;
  getRecentNotes(limit: number): Promise<Note[]>;
  getNotesByCategory(category: string): Promise<Note[]>;
  updateNoteDownloads(noteId: number): Promise<Note>;
  updateNoteLikes(noteId: number, increment: boolean): Promise<Note>;
  
  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByNoteId(noteId: number): Promise<Comment[]>;
  
  // Download tracking
  recordDownload(download: InsertDownload): Promise<Download>;
  getDownloadsByUserId(userId: number): Promise<Download[]>;
  
  // Like tracking
  createOrToggleLike(like: InsertLike): Promise<Like | null>;
  getLikeByUserAndNote(userId: number, noteId: number): Promise<Like | undefined>;
  
  // Category/Tag utils
  getCategories(): Promise<{name: string, count: number}[]>;
  
  // Discussion methods
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussionById(id: number): Promise<Discussion | undefined>;
  getDiscussions(page: number, limit: number): Promise<Discussion[]>;
  getDiscussionsByCategory(category: string): Promise<Discussion[]>;
  getDiscussionsByUserId(userId: number): Promise<Discussion[]>;
  updateDiscussionViews(discussionId: number): Promise<Discussion>;
  
  // Discussion reply methods
  createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;
  getDiscussionRepliesByDiscussionId(discussionId: number): Promise<DiscussionReply[]>;
  
  // Follow methods
  createFollow(follow: InsertFollow): Promise<Follow>;
  removeFollow(followerId: number, followedId: number): Promise<void>;
  getFollowByIds(followerId: number, followedId: number): Promise<Follow | undefined>;
  getFollowersByUserId(userId: number): Promise<User[]>;
  getFollowingByUserId(userId: number): Promise<User[]>;
  
  // User library methods
  getUserDownloads(userId: number): Promise<Download[]>;
  getUserLikes(userId: number): Promise<Like[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<number, Note>;
  private comments: Map<number, Comment>;
  private downloads: Map<number, Download>;
  private likes: Map<number, Like>;
  private discussions: Map<number, Discussion>;
  private discussionReplies: Map<number, DiscussionReply>;
  private follows: Map<number, Follow>;
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentNoteId: number;
  currentCommentId: number;
  currentDownloadId: number;
  currentLikeId: number;
  currentDiscussionId: number;
  currentDiscussionReplyId: number;
  currentFollowId: number;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.comments = new Map();
    this.downloads = new Map();
    this.likes = new Map();
    this.discussions = new Map();
    this.discussionReplies = new Map();
    this.follows = new Map();
    
    this.currentUserId = 1;
    this.currentNoteId = 1;
    this.currentCommentId = 1;
    this.currentDownloadId = 1;
    this.currentLikeId = 1;
    this.currentDiscussionId = 1;
    this.currentDiscussionReplyId = 1;
    this.currentFollowId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    
    // Add some default categories for demo
    this.seedCategories();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      coins: 0, 
      avatarUrl: null, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserCoins(userId: number, coins: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, coins: user.coins + coins };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getTopContributors(limit: number): Promise<User[]> {
    const userUploads = new Map<number, number>();
    
    // Count uploads per user
    for (const note of this.notes.values()) {
      const count = userUploads.get(note.userId) || 0;
      userUploads.set(note.userId, count + 1);
    }
    
    // Get users with their upload counts
    return Array.from(this.users.values())
      .map(user => {
        const uploadCount = userUploads.get(user.id) || 0;
        return { user, uploadCount };
      })
      .sort((a, b) => b.uploadCount - a.uploadCount)
      .slice(0, limit)
      .map(item => item.user);
  }

  // Note methods
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const now = new Date();
    const note: Note = {
      ...insertNote,
      id,
      downloads: 0,
      likes: 0,
      createdAt: now
    };
    this.notes.set(id, note);
    
    // Award coins to the user for uploading a note
    const coinsToAward = note.isPremium ? 10 : 5;
    await this.updateUserCoins(note.userId, coinsToAward);
    
    return note;
  }
  
  async getNoteById(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async getNotesByUserId(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.userId === userId
    );
  }
  
  async searchNotes(query: string): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.notes.values()).filter(note => 
      note.title.toLowerCase().includes(lowerQuery) || 
      note.description.toLowerCase().includes(lowerQuery) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }
  
  async getAllNotes(page: number = 1, limit: number = 10): Promise<Note[]> {
    const allNotes = Array.from(this.notes.values());
    const start = (page - 1) * limit;
    return allNotes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + limit);
  }
  
  async getTrendingNotes(limit: number = 6): Promise<Note[]> {
    return Array.from(this.notes.values())
      .sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes))
      .slice(0, limit);
  }
  
  async getRecentNotes(limit: number = 6): Promise<Note[]> {
    return Array.from(this.notes.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getNotesByCategory(category: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      note => note.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  async updateNoteDownloads(noteId: number): Promise<Note> {
    const note = await this.getNoteById(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const updatedNote = { ...note, downloads: note.downloads + 1 };
    this.notes.set(noteId, updatedNote);
    return updatedNote;
  }
  
  async updateNoteLikes(noteId: number, increment: boolean): Promise<Note> {
    const note = await this.getNoteById(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    
    const updatedLikes = increment ? note.likes + 1 : note.likes - 1;
    const updatedNote = { ...note, likes: Math.max(0, updatedLikes) };
    this.notes.set(noteId, updatedNote);
    return updatedNote;
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async getCommentsByNoteId(noteId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.noteId === noteId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Download tracking
  async recordDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.currentDownloadId++;
    const now = new Date();
    const download: Download = {
      ...insertDownload,
      id,
      createdAt: now
    };
    this.downloads.set(id, download);
    
    // Update note download count
    await this.updateNoteDownloads(insertDownload.noteId);
    
    return download;
  }
  
  async getDownloadsByUserId(userId: number): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .filter(download => download.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Like tracking
  async getLikeByUserAndNote(userId: number, noteId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.noteId === noteId
    );
  }
  
  async createOrToggleLike(insertLike: InsertLike): Promise<Like | null> {
    // Check if like already exists
    const existingLike = await this.getLikeByUserAndNote(insertLike.userId, insertLike.noteId);
    
    if (existingLike) {
      // Unlike - remove existing like
      this.likes.delete(existingLike.id);
      await this.updateNoteLikes(insertLike.noteId, false);
      return null;
    } else {
      // Like - create new like
      const id = this.currentLikeId++;
      const now = new Date();
      const like: Like = {
        ...insertLike,
        id,
        createdAt: now
      };
      this.likes.set(id, like);
      
      // Update note like count
      await this.updateNoteLikes(insertLike.noteId, true);
      
      return like;
    }
  }

  // Category/Tag utils
  async getCategories(): Promise<{name: string, count: number}[]> {
    const categories = new Map<string, number>();
    
    for (const note of this.notes.values()) {
      const count = categories.get(note.category) || 0;
      categories.set(note.category, count + 1);
    }
    
    return Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
  }
  
  // Helper method to seed initial categories for demo
  private seedCategories() {
    const defaultCategories = ['Academic', 'Technical', 'Business', 'Creative', 'Law & Politics'];
    // In a real app, categories would be derived from notes
    // This is just for UI demonstration
  }
  
  // Discussion methods
  async createDiscussion(insertDiscussion: InsertDiscussion): Promise<Discussion> {
    const id = this.currentDiscussionId++;
    const now = new Date();
    const discussion: Discussion = {
      ...insertDiscussion,
      id,
      likes: 0,
      views: 0,
      isPinned: false,
      createdAt: now,
      updatedAt: now
    };
    this.discussions.set(id, discussion);
    return discussion;
  }
  
  async getDiscussionById(id: number): Promise<Discussion | undefined> {
    return this.discussions.get(id);
  }
  
  async getDiscussions(page: number = 1, limit: number = 10): Promise<Discussion[]> {
    const allDiscussions = Array.from(this.discussions.values());
    const start = (page - 1) * limit;
    return allDiscussions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + limit);
  }
  
  async getDiscussionsByCategory(category: string): Promise<Discussion[]> {
    return Array.from(this.discussions.values()).filter(
      discussion => discussion.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  async getDiscussionsByUserId(userId: number): Promise<Discussion[]> {
    return Array.from(this.discussions.values()).filter(
      discussion => discussion.userId === userId
    );
  }
  
  async updateDiscussionViews(discussionId: number): Promise<Discussion> {
    const discussion = await this.getDiscussionById(discussionId);
    if (!discussion) {
      throw new Error(`Discussion with ID ${discussionId} not found`);
    }
    
    const updatedDiscussion = { ...discussion, views: discussion.views + 1 };
    this.discussions.set(discussionId, updatedDiscussion);
    return updatedDiscussion;
  }
  
  // Discussion reply methods
  async createDiscussionReply(insertReply: InsertDiscussionReply): Promise<DiscussionReply> {
    const id = this.currentDiscussionReplyId++;
    const now = new Date();
    const reply: DiscussionReply = {
      ...insertReply,
      id,
      likes: 0,
      createdAt: now,
      updatedAt: now
    };
    this.discussionReplies.set(id, reply);
    return reply;
  }
  
  async getDiscussionRepliesByDiscussionId(discussionId: number): Promise<DiscussionReply[]> {
    return Array.from(this.discussionReplies.values())
      .filter(reply => reply.discussionId === discussionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Oldest first
  }
  
  // Follow methods
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const id = this.currentFollowId++;
    const now = new Date();
    const follow: Follow = {
      ...insertFollow,
      id,
      createdAt: now
    };
    this.follows.set(id, follow);
    return follow;
  }
  
  async removeFollow(followerId: number, followedId: number): Promise<void> {
    const follow = await this.getFollowByIds(followerId, followedId);
    if (follow) {
      this.follows.delete(follow.id);
    }
  }
  
  async getFollowByIds(followerId: number, followedId: number): Promise<Follow | undefined> {
    return Array.from(this.follows.values()).find(
      follow => follow.followerId === followerId && follow.followedId === followedId
    );
  }
  
  async getFollowersByUserId(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(follow => follow.followedId === userId)
      .map(follow => follow.followerId);
    
    return Array.from(this.users.values())
      .filter(user => followerIds.includes(user.id));
  }
  
  async getFollowingByUserId(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followedId);
    
    return Array.from(this.users.values())
      .filter(user => followingIds.includes(user.id));
  }
  
  // User library methods
  async getUserDownloads(userId: number): Promise<Download[]> {
    return this.getDownloadsByUserId(userId);
  }
  
  async getUserLikes(userId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
