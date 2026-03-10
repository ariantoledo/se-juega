import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User } from "lucide-react";

export default function RequestCard({ request, onAccept, onReject, loading }) {
  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{request.player_name}</p>
            <Badge variant="outline" className="text-xs mt-0.5">{request.position}</Badge>
          </div>
        </div>
        {request.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request)}
              disabled={loading}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept(request)}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        )}
        {request.status === "accepted" && (
          <Badge className="bg-primary/10 text-primary border-0">Aceptado</Badge>
        )}
        {request.status === "rejected" && (
          <Badge className="bg-destructive/10 text-destructive border-0">Rechazado</Badge>
        )}
      </div>
    </Card>
  );
}