
  async deleteBroadcast(broadcastId: string) {
    return this.prisma.broadcast.delete({
      where: { id: broadcastId },
    });
  }

  async getBroadcastStats(broadcastId: string) {
    const groups = await this.prisma.broadcastGroup.groupBy({
      by: ['status'],
      where: { broadcastId },
      _count: true,
    });

    return {
      pending: groups.find((g) => g.status === SendStatus.PENDING)?._count || 0,
      sending: groups.find((g) => g.status === SendStatus.SENDING)?._count || 0,
      sent: groups.find((g) => g.status === SendStatus.SENT)?._count || 0,
      failed: groups.find((g) => g.status === SendStatus.FAILED)?._count || 0,
    };
  }

  private async markGroupFailed(
    broadcastId: string,
    broadcastGroupId: string,
    error: string,
  ) {
    await this.prisma.broadcastGroup.update({
      where: { id: broadcastGroupId },
      data: {
        status: SendStatus.FAILED,
        error,
      },
    });

    const group = await this.prisma.broadcastGroup.findUnique({
      where: { id: broadcastGroupId },
      include: { group: true },
    });

    await this.prisma.broadcastLog.create({
      data: {
        broadcastId,
        groupName: group?.group.name || 'Unknown',
        status: SendStatus.FAILED,
        message: error,
      },
    });
  }
}