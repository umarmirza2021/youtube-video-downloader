#!/usr/bin/env python3
"""Fetch Instagram reel/story metadata via instaloader. Outputs JSON to stdout."""
import argparse
import json
import sys
import tempfile
import os

def output(data, code=0):
    print(json.dumps(data))
    sys.exit(code)

def err(msg, code='ERROR'):
    output({'error': msg, 'code': code}, 1)

try:
    import instaloader
except ImportError:
    err('instaloader is not installed. Run: pip install instaloader', 'NO_INSTALOADER')

def fetch_reel(url):
    L = instaloader.Instaloader(download_pictures=False, download_videos=False,
                                download_video_thumbnails=False, quiet=True)
    try:
        shortcode = None
        if '/reel/' in url:
            shortcode = url.split('/reel/')[1].split('/')[0].split('?')[0]
        elif '/p/' in url:
            shortcode = url.split('/p/')[1].split('/')[0].split('?')[0]
        if not shortcode:
            err('Invalid Instagram reel URL', 'INVALID_URL')

        post = instaloader.Post.from_shortcode(L.context, shortcode)
        return {
            'platform': 'instagram-reel',
            'id': shortcode,
            'title': (post.caption or '')[:200] or 'Instagram Reel',
            'caption': (post.caption or '')[:500],
            'channel': post.owner_username,
            'thumbnail': post.url if post.is_video else post.url,
            'isVideo': post.is_video,
            'url': url,
            'engine': 'instaloader',
        }
    except instaloader.exceptions.PrivateProfileNotFollowedException:
        err('This account is private.', 'PRIVATE')
    except instaloader.exceptions.LoginRequiredException:
        err('Login required — this content may be private.', 'PRIVATE')
    except Exception as e:
        msg = str(e).lower()
        if 'private' in msg:
            err('This account is private.', 'PRIVATE')
        err(str(e), 'UNKNOWN')

def fetch_stories(url=None, username=None):
    L = instaloader.Instaloader(download_pictures=False, download_videos=False, quiet=True)
    try:
        if url and '/stories/' in url:
            parts = url.split('/stories/')[1].split('/')
            username = parts[0]
        if not username:
            err('Username or story URL required', 'INVALID_URL')

        profile = instaloader.Profile.from_username(L.context, username)
        if profile.is_private:
            err('This account is private.', 'PRIVATE')

        stories = []
        for story in L.get_stories(userids=[profile.userid]):
            for item in story.get_items():
                stories.append({
                    'id': str(item.mediaid),
                    'thumbnail': item.url,
                    'isVideo': item.is_video,
                    'takenAt': item.date.isoformat(),
                    'url': f'https://www.instagram.com/stories/{username}/{item.mediaid}/',
                })

        if not stories:
            err('No active stories found — they may have expired.', 'EXPIRED')

        return {
            'platform': 'instagram-story',
            'title': f'@{username} stories',
            'channel': username,
            'thumbnail': stories[0]['thumbnail'],
            'stories': stories,
            'url': url or f'https://www.instagram.com/{username}/',
            'engine': 'instaloader',
        }
    except instaloader.exceptions.ProfileNotExistsException:
        err('Instagram user not found.', 'INVALID_URL')
    except Exception as e:
        msg = str(e).lower()
        if 'private' in msg:
            err('This account is private.', 'PRIVATE')
        err(str(e), 'UNKNOWN')

def download_media(url, story_id=None, username=None):
    L = instaloader.Instaloader(download_pictures=True, download_videos=True, quiet=True)
    tmpdir = tempfile.mkdtemp()
    L.dirname_pattern = tmpdir
    try:
        if story_id and username:
            profile = instaloader.Profile.from_username(L.context, username)
            for story in L.get_stories(userids=[profile.userid]):
                for item in story.get_items():
                    if str(item.mediaid) == str(story_id):
                        L.download_storyitem(item, username)
                        for f in os.listdir(tmpdir):
                            if f.endswith(('.mp4', '.jpg', '.png')):
                                return os.path.join(tmpdir, f)
            err('Story not found or expired.', 'EXPIRED')
        else:
            shortcode = None
            if '/reel/' in url:
                shortcode = url.split('/reel/')[1].split('/')[0].split('?')[0]
            elif '/p/' in url:
                shortcode = url.split('/p/')[1].split('/')[0].split('?')[0]
            post = instaloader.Post.from_shortcode(L.context, shortcode)
            L.download_post(post, shortcode)
            for f in os.listdir(tmpdir):
                if f.endswith(('.mp4', '.jpg', '.png')):
                    return os.path.join(tmpdir, f)
            err('Could not download media', 'UNKNOWN')
    except Exception as e:
        err(str(e), 'UNKNOWN')

def download_stories_zip(url=None, username=None):
    import zipfile
    L = instaloader.Instaloader(download_pictures=True, download_videos=True, quiet=True)
    tmpdir = tempfile.mkdtemp()
    L.dirname_pattern = tmpdir
    if url and '/stories/' in url:
        username = url.split('/stories/')[1].split('/')[0]
    if not username:
        err('Username required', 'INVALID_URL')
    profile = instaloader.Profile.from_username(L.context, username)
    if profile.is_private:
        err('This account is private.', 'PRIVATE')
    count = 0
    for story in L.get_stories(userids=[profile.userid]):
        for item in story.get_items():
            L.download_storyitem(item, username)
            count += 1
    if count == 0:
        err('No active stories found — they may have expired.', 'EXPIRED')
    zip_path = os.path.join(tempfile.gettempdir(), f'{username}-stories.zip')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(tmpdir):
            for f in files:
                if f.endswith(('.mp4', '.jpg', '.png', '.txt')):
                    fp = os.path.join(root, f)
                    zf.write(fp, f)
    return zip_path

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', required=True, choices=['reel-info', 'story-info', 'download', 'stories-zip'])
    parser.add_argument('--url', default='')
    parser.add_argument('--username', default='')
    parser.add_argument('--story-id', default='')
    args = parser.parse_args()

    if args.mode == 'reel-info':
        output(fetch_reel(args.url))
    elif args.mode == 'story-info':
        output(fetch_stories(args.url, args.username))
    elif args.mode == 'download':
        path = download_media(args.url, args.story_id or None, args.username or None)
        output({'path': path})
    elif args.mode == 'stories-zip':
        path = download_stories_zip(args.url, args.username)
        output({'path': path})