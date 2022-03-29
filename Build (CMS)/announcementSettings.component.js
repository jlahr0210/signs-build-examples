( function() {
    'use strict';

    angular
        .module( 'reachapp.editor' )
        .component( 'announcementSettings', {
            templateUrl: 'editor/editZoneModal/components/modalPanes/announcementSettings/announcementSettings.html',
            bindings: {
                facilityId: '<',
                screenId: '<',
                backgroundColor: '<',
                shuffle: '<',
                muteVideos: '<',
                zoneWidth: '<',
                zoneHeight: '<',
                updateProp: '&',
            },
            controller: AnnouncementSettingsController,
        });

    /**
     * @typedef {angular.IComponentController} AnnouncementSettingsController
     * @property {string} facilityId
     * @property {string} screenId
     * @property {string} backgroundColor
     * @property {boolean} shuffle
     * @property {boolean} muteVideos
     * @property {number} zoneWidth
     * @property {number} zoneHeight
     * @property {function} updateProp
     */

    /**
     * @param {confirmModal} confirmModal
     * @param {angular.IQService} $q
     * @param {userService} userService
     * @param api
     * @param {logger} logger
     * @param {uniqueIdService} uniqueIdService
     * @constructor
     * @ngInject
     */
    function AnnouncementSettingsController( confirmModal, $q, userService, api, logger, uniqueIdService ) {
        var ctrl = this;

        // function for making html IDs unique
        ctrl.addUniqueId = uniqueIdService.getUniqueIdFunction();

        ctrl.showCreate = false;
        ctrl.checkRootUser = userService.user.isRoot;
        ctrl.cssguibgcolorDefault = {
            'background-image': 'url(././assets/transparent-grid.jpg)',
        };
        ctrl.newPlaylist = {};
        ctrl.pickerColor = '';
        ctrl.availablePlaylists = [];
        ctrl.userCanCreatePlaylist = false;

        ctrl.$onInit = function() {
            ctrl.getAvailablePlaylists()
                .then( function( playlists ) {
                    ctrl.availablePlaylists = playlists;
                });

            ctrl.playlistSelect = ctrl.screenId;
            ctrl.backgroundColorChanged();
            ctrl.canCreatePlaylist();
        };

        ctrl.checkRatio = function() {
            if ( ctrl.newPlaylist.width && ctrl.newPlaylist.height ) {
                ctrl.newAnnRatio = reduceFraction( ctrl.newPlaylist.width, ctrl.newPlaylist.height );
                // eslint-disable-next-line max-len
                var playlistEquality = Math.round( parseFloat( ctrl.newPlaylist.width ) / parseFloat( ctrl.newPlaylist.height ) * 10 ) / 10;
                ctrl.ratioWarning = ( ctrl.zoneEquality !== playlistEquality );
            }
        };

        ctrl.setZoneRatio = function() {
            ctrl.zoneEquality = Math.round( parseFloat( ctrl.zoneWidth ) / parseFloat( ctrl.zoneHeight ) * 10 ) / 10;
            ctrl.zoneRatio = reduceFraction( ctrl.zoneWidth, ctrl.zoneHeight );
        };

        ctrl.checkName = function() {
            if ( ctrl.newPlaylist.name ) {
                ctrl.formIsInvalid = ( ctrl.newPlaylist.name.length === 0 );
            } else {
                ctrl.formIsInvalid = true;
            }
        };

        ctrl.setPlaylist = function() {
            if ( ctrl.playlistSelect === 'Create' ) {
                ctrl.showCreate = true;
            } else {
                ctrl.showCreate = false;

                var s = _.find( ctrl.availablePlaylists, function( screen ) {
                    return ctrl.playlistSelect === screen.screen_id;
                });

                ctrl.updateProp({ key: 'facilityid', value: s.facility_id });
                ctrl.updateProp({ key: 'screenid', value: s.screen_id });
            }
        };

        ctrl.createNewPlaylist = function() {
            if ( ctrl.newPlaylist && ctrl.newPlaylist.name ) {
                ctrl.formIsInvalid = false;
                confirmModal.open( 'Create New Announcement Screen?' )
                    .then( function() {
                        ctrl.isSubmitting = true;

                        ctrl.createPlaylist({ playlist: ctrl.newPlaylist })
                            .then( function( playlist ) {
                                ctrl.availablePlaylists.push( playlist );
                                ctrl.isSubmitting = false;
                                ctrl.showCreate = false;

                                ctrl.playlistSelect = playlist.screen_id;
                                ctrl.setPlaylist( playlist );

                                logger.success( 'Playlist has been created!' );
                            });
                    });
            } else {
                ctrl.formIsInvalid = true;
            }
        };

        ctrl.backgroundColorChanged = function() {
            if ( ctrl.backgroundColor !== '' ) {
                ctrl.cssguibgcolor = {
                    'background-color': ctrl.backgroundColor,
                };
                ctrl.updateProp({ key: 'background_color', value: ctrl.backgroundColor });
            } else {
                ctrl.cssguibgcolor = {
                    'background-image': 'url(././assets/transparent-grid.jpg)',
                };
                ctrl.updateProp({ key: 'background_color', value: '' });
            }
        };

        ctrl.removeBackgroundColor = function() {
            ctrl.updateProp({ key: 'background_color', value: '' });
        };

        ctrl.getAvailablePlaylists = function() {
            if ( !userService.user ) {
                return $q.reject( 'No user identified.' );
            }
            return userService.user.facility()
                .then( function( res ) {
                    return api.interop.getScreensForUser(
                        userService.token(),
                        userService.effectiveUsername(),
                        res.id
                    )
                        .then( function( res ) {
                            var playlists = res.screens;
                            _.each( playlists, function( screen ) {
                                screen.screen_id = screen.screen_id.toString();
                            });
                            return playlists;
                        });
                });
        };

        ctrl.canCreatePlaylist = function() {
            if ( userService.user.isRoot ) {
                ctrl.userCanCreatePlaylist = true;
            } else {
                userService.user.facility()
                    .then( function( facilityObj ) {
                        return userService.user.canCreateScreen( facilityObj.id );
                    })
                    .then( function( result ) {
                        ctrl.userCanCreatePlaylist = result.can_create_screen;
                    });
            }
        };

        ctrl.createPlaylist = function( playlistData ) {
            return $q( function( resolve, reject ) {
                return userService.user.facility()
                    .then( function( facility ) {
                    //Create Playlist
                        return api.interop.createAnnouncement(
                            userService.token(),
                            facility.id,
                            playlistData.playlist.name,
                            playlistData.playlist.width,
                            playlistData.playlist.height,
                            userService.user.username
                        )
                            .then( function( result ) {

                                var obj = {
                                    facility_id: result.screen.facilityId,
                                    height: parseInt( result.screen.height ),
                                    name: result.screen.name,
                                    screen_id: result.screen.screenId,
                                    width: parseInt( result.screen.width ),
                                };

                                resolve( obj );

                            }, function( error ) {
                                reject();
                                logger.error( 'Failed to create screen' + error, error );
                            });
                    });
            });
        };
    }

    /**
     * @param {number} numerator
     * @param {number} denominator
     * @returns {number[]}
     */
    function reduceFraction( numerator, denominator ) {
        var divisor = greatestCommonDenominator( numerator, denominator );
        return [ numerator / divisor, denominator / divisor ];
    }

    /**
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    function greatestCommonDenominator( a, b ) {
        return b ? greatestCommonDenominator( b, a % b ) : a;
    }
})();
