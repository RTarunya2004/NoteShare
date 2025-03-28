import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupUploadRoutes } from "./upload";
import { z } from "zod";
import { insertCommentSchema, insertLikeSchema, insertDownloadSchema, insertDiscussionSchema, insertDiscussionReplySchema, insertFollowSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up file upload routes
  setupUploadRoutes(app);
  
  // Notes endpoints
  app.get("/api/notes", async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const notes = await storage.getAllNotes(page, limit);
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  
  app.get("/api/notes/trending", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 6;
      const notes = await storage.getTrendingNotes(limit);
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending notes" });
    }
  });
  
  app.get("/api/notes/recent", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 6;
      const notes = await storage.getRecentNotes(limit);
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });
  
  app.get("/api/notes/search", async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || "");
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const notes = await storage.searchNotes(query);
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to search notes" });
    }
  });
  
  app.get("/api/notes/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const notes = await storage.getNotesByCategory(category);
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes by category" });
    }
  });
  
  app.get("/api/notes/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const note = await storage.getNoteById(id);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(200).json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });
  
  app.get("/api/users/:userId/notes", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const notes = await storage.getNotesByUserId(userId);
      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user notes" });
    }
  });
  
  // Comments endpoints
  app.post("/api/notes/:noteId/comments", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const noteId = Number(req.params.noteId);
      const userId = req.user!.id;
      
      const note = await storage.getNoteById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        noteId,
        userId
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  app.get("/api/notes/:noteId/comments", async (req: Request, res: Response) => {
    try {
      const noteId = Number(req.params.noteId);
      const comments = await storage.getCommentsByNoteId(noteId);
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  // Likes endpoints
  app.post("/api/notes/:noteId/like", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const noteId = Number(req.params.noteId);
      const userId = req.user!.id;
      
      const note = await storage.getNoteById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const likeData = insertLikeSchema.parse({
        noteId,
        userId
      });
      
      const result = await storage.createOrToggleLike(likeData);
      const isLiked = !!result; // true if liked, false if unliked
      
      res.status(200).json({ isLiked });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid like data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process like" });
    }
  });
  
  // Download endpoints
  app.post("/api/notes/:noteId/download", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const noteId = Number(req.params.noteId);
      const userId = req.user!.id;
      
      const note = await storage.getNoteById(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Check if premium and user has enough coins
      if (note.isPremium) {
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (user.coins < note.coinPrice) {
          return res.status(403).json({ 
            message: "Insufficient coins", 
            required: note.coinPrice, 
            available: user.coins 
          });
        }
        
        // Deduct coins from user
        await storage.updateUserCoins(userId, -note.coinPrice);
        
        // Add coins to note owner (except if downloading own note)
        if (userId !== note.userId) {
          await storage.updateUserCoins(note.userId, note.coinPrice);
        }
      }
      
      const downloadData = insertDownloadSchema.parse({
        noteId,
        userId
      });
      
      await storage.recordDownload(downloadData);
      
      // In a real app, this would generate a download URL or stream the file
      // For this MVP, we just return success with the fileUrl
      res.status(200).json({ 
        message: "Download successful", 
        fileUrl: note.fileUrl,
        fileName: note.fileName
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid download data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process download" });
    }
  });
  
  // Category endpoints
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Top contributors
  app.get("/api/contributors/top", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 4;
      const contributors = await storage.getTopContributors(limit);
      res.status(200).json(contributors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top contributors" });
    }
  });
  
  // Get user by ID
  app.get("/api/users/:userId", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in the response
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // User stats (protected)
  app.get("/api/user/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userNotes = await storage.getNotesByUserId(userId);
      const userDownloads = await storage.getDownloadsByUserId(userId);
      
      // Get unique downloads (notes downloaded by this user)
      const uniqueDownloads = new Set(userDownloads.map(d => d.noteId));
      
      // Count likes received on user's notes
      let totalLikes = 0;
      for (const note of userNotes) {
        totalLikes += note.likes;
      }
      
      res.status(200).json({
        uploads: userNotes.length,
        downloads: uniqueDownloads.size,
        coins: user.coins,
        likes: totalLikes
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });
  
  // User library endpoints
  app.get("/api/user/downloads", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const downloads = await storage.getUserDownloads(userId);
      res.status(200).json(downloads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user downloads" });
    }
  });
  
  app.get("/api/user/likes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      const likes = await storage.getUserLikes(userId);
      res.status(200).json(likes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user likes" });
    }
  });
  
  // Follow endpoints
  app.post("/api/users/:userId/follow", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const followerId = req.user!.id;
      const followedId = Number(req.params.userId);
      
      if (followerId === followedId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const followedUser = await storage.getUser(followedId);
      if (!followedUser) {
        return res.status(404).json({ message: "User to follow not found" });
      }
      
      // Check if already following
      const existingFollow = await storage.getFollowByIds(followerId, followedId);
      
      if (existingFollow) {
        // Unfollow
        await storage.removeFollow(followerId, followedId);
        res.status(200).json({ following: false });
      } else {
        // Follow
        const followData = insertFollowSchema.parse({
          followerId,
          followedId
        });
        
        await storage.createFollow(followData);
        res.status(200).json({ following: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid follow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process follow request" });
    }
  });
  
  app.get("/api/users/:userId/followers", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const followers = await storage.getFollowersByUserId(userId);
      res.status(200).json(followers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });
  
  app.get("/api/users/:userId/following", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const following = await storage.getFollowingByUserId(userId);
      res.status(200).json(following);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following users" });
    }
  });
  
  app.get("/api/users/:userId/is-following", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const followerId = req.user!.id;
      const followedId = Number(req.params.userId);
      
      const existingFollow = await storage.getFollowByIds(followerId, followedId);
      res.status(200).json({ following: !!existingFollow });
    } catch (error) {
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
  
  // Discussion forum endpoints
  app.get("/api/discussions", async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const discussions = await storage.getDiscussions(page, limit);
      res.status(200).json(discussions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions" });
    }
  });
  
  app.get("/api/discussions/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const discussions = await storage.getDiscussionsByCategory(category);
      res.status(200).json(discussions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussions by category" });
    }
  });
  
  app.get("/api/discussions/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const discussion = await storage.getDiscussionById(id);
      
      if (!discussion) {
        return res.status(404).json({ message: "Discussion not found" });
      }
      
      // Increment view count
      await storage.updateDiscussionViews(id);
      
      res.status(200).json(discussion);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussion" });
    }
  });
  
  app.post("/api/discussions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user!.id;
      
      const discussionData = insertDiscussionSchema.parse({
        ...req.body,
        userId
      });
      
      const discussion = await storage.createDiscussion(discussionData);
      res.status(201).json(discussion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid discussion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create discussion" });
    }
  });
  
  app.get("/api/discussions/:discussionId/replies", async (req: Request, res: Response) => {
    try {
      const discussionId = Number(req.params.discussionId);
      const replies = await storage.getDiscussionRepliesByDiscussionId(discussionId);
      res.status(200).json(replies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discussion replies" });
    }
  });
  
  app.post("/api/discussions/:discussionId/replies", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const discussionId = Number(req.params.discussionId);
      const userId = req.user!.id;
      
      const discussion = await storage.getDiscussionById(discussionId);
      if (!discussion) {
        return res.status(404).json({ message: "Discussion not found" });
      }
      
      const replyData = insertDiscussionReplySchema.parse({
        ...req.body,
        discussionId,
        userId
      });
      
      const reply = await storage.createDiscussionReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reply data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
