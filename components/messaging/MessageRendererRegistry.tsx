"use client";

import React from "react";
import { MessageBubble } from "./MessageBubble";
import type { ConversationPresentation, MessageDto, AttachmentDto, SignedMedia } from "@/lib/messaging/messages-api";
import type { MessageGroup } from "@/lib/messaging/selectors/group-messages";

export type MessageRendererProps = {
  group: MessageGroup;
  message: MessageDto;
  counterpartAvatar?: SignedMedia | null;
  counterpartName?: string;
  removedLabel?: string;
  onOpenGallery?: (attachments: AttachmentDto[], index: number) => void;
  onRetryMediaUpload?: (clientMessageId: string) => void;
  uploadLabels?: {
    uploading: string;
    failed: string;
    retry: string;
  };
};

type RendererComponent = React.ComponentType<MessageRendererProps>;

class MessageRendererRegistryClass {
  private readonly renderers = new Map<string, RendererComponent>();

  register(type: string, component: RendererComponent): void {
    this.renderers.set(type.toUpperCase(), component);
  }

  resolve(type: string): RendererComponent | null {
    return this.renderers.get(type.toUpperCase()) ?? null;
  }

  render(props: MessageRendererProps): React.ReactNode {
    const Component = this.resolve(props.message.type) ?? DefaultTextRenderer;
    return <Component {...props} />;
  }
}

function TextMessageRenderer(props: MessageRendererProps) {
  return (
    <MessageBubble
      group={props.group}
      counterpartAvatar={props.counterpartAvatar}
      counterpartName={props.counterpartName}
      removedLabel={props.removedLabel}
      uploadLabels={props.uploadLabels}
      onRetryMediaUpload={props.onRetryMediaUpload}
    />
  );
}

function ImageMessageRenderer(props: MessageRendererProps) {
  return (
    <MessageBubble
      group={props.group}
      counterpartAvatar={props.counterpartAvatar}
      counterpartName={props.counterpartName}
      removedLabel={props.removedLabel}
      onOpenGallery={props.onOpenGallery}
      uploadLabels={props.uploadLabels}
      onRetryMediaUpload={props.onRetryMediaUpload}
    />
  );
}

function FileMessageRenderer(props: MessageRendererProps) {
  return (
    <MessageBubble
      group={props.group}
      counterpartAvatar={props.counterpartAvatar}
      counterpartName={props.counterpartName}
      removedLabel={props.removedLabel}
      uploadLabels={props.uploadLabels}
      onRetryMediaUpload={props.onRetryMediaUpload}
    />
  );
}

const DefaultTextRenderer = TextMessageRenderer;

export const messageRendererRegistry = new MessageRendererRegistryClass();

messageRendererRegistry.register("TEXT", TextMessageRenderer);
messageRendererRegistry.register("IMAGE", ImageMessageRenderer);
messageRendererRegistry.register("FILE", FileMessageRenderer);

export function isRegistryMessageType(type: string): boolean {
  return messageRendererRegistry.resolve(type) != null;
}
