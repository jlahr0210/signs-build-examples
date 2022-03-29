describe( 'Component:  announcementSettings', function() {
    /**
     * @type TestData
     */
    var TestData;
    var $componentController;
    var confirmModal;
    var api;
    var $q;
    var $rootScope;
    var userService;

    var FakeUserService;
    var bindings;
    var locals;
    var playlists;
    var ctrl;

    var getAvailablePlaylistsStub;
    var confirmModalOpenStub;
    var createAnnouncementStub;

    beforeEach( module( 'reachapp.editor', 'test' ));
    beforeEach( inject( function( $injector ) {
        $componentController = $injector.get( '$componentController' );
        confirmModal = $injector.get( 'confirmModal' );
        api = $injector.get( 'api' );
        $q = $injector.get( '$q' );
        $rootScope = $injector.get( '$rootScope' );
        TestData = $injector.get( 'TestData' );

        getAvailablePlaylistsStub = sinon.stub( api.interop, 'getScreensForUser' );
        playlists = [
            TestData.getAnnouncement({ facility_id: '2', screen_id: '1' }),
            TestData.getAnnouncement({ facility_id: '2', screen_id: '2' }),
        ];
        getAvailablePlaylistsStub.returns( $q.resolve({ screens: playlists }));

        createAnnouncementStub = sinon.stub( api.interop, 'createAnnouncement' );
        createAnnouncementStub.returns( $q.resolve());
        confirmModalOpenStub = sinon.stub( confirmModal, 'open' );
        confirmModalOpenStub.returns( $q.resolve());

        FakeUserService = $injector.get( 'FakeUserService' );
        FakeUserService.createRootUser();
        userService = FakeUserService.userService;
        $rootScope.$apply();

        bindings = {
            facilityId: '',
            screenId: '',
            backgroundColor: 'blue',
            shuffle: false,
            muteVideos: true,
            zoneWidth: 1920,
            zoneHeight: 1080,
            updateProp: sinon.stub(),
        };

        locals = {
            userService: userService,
            confirmModal: confirmModal,
        };
        ctrl = $componentController( 'announcementSettings', locals, bindings );
    }));

    it( 'should initialize available playlists', function() {
        ctrl.$onInit();
        $rootScope.$apply();
        expect( ctrl.userCanCreatePlaylist ).to.be.true;
        expect( ctrl.availablePlaylists.length ).to.equal( 2 );
    });

    describe( 'setZoneRatio', function() {
        it( 'should set zone equality', function() {
            ctrl.zoneWidth = 1920;
            ctrl.zoneHeight = 1080;
            ctrl.setZoneRatio();
            expect( ctrl.zoneEquality ).to.equal( 1.8, 'zoneEquality property is wrong' );
        });

        it( 'should set zoneRatio correctly', function() {
            ctrl.zoneWidth = 1920;
            ctrl.zoneHeight = 1080;
            ctrl.setZoneRatio();
            expect( ctrl.zoneRatio ).to.deep.equal([ 16, 9 ], 'zoneRatio property is wrong' );
            ctrl.zoneWidth = 1000;
            ctrl.zoneHeight = 500;
            ctrl.setZoneRatio();
            expect( ctrl.zoneRatio ).to.deep.equal([ 2, 1 ], 'zoneRatio property is wrong' );
        });
    });

    describe( 'checkRatio', function() {
        it( 'should check the ratio of new playlist against zone ratio', function() {
            ctrl.zoneWidth = 1920;
            ctrl.zoneHeight = 1080;
            ctrl.setZoneRatio();
            ctrl.newPlaylist = {
                width: 1280,
                height: 720,
            };
            ctrl.checkRatio();
            expect( ctrl.newAnnRatio ).to.deep.equal([ 16, 9 ]);
            expect( ctrl.ratioWarning ).to.be.false;
        });
    });

    describe( 'checkName', function() {
        it( 'should set formIsInvalid to true if the name is not there', function() {
            ctrl.checkName();
            expect( ctrl.formIsInvalid ).to.be.true;
        });

        it( 'should set formIsInvalid to true if the name has no characters', function() {
            ctrl.newPlaylist = {
                name: '',
            };
            ctrl.checkName();
            expect( ctrl.formIsInvalid ).to.be.true;
        });

        it( 'should set formIsInvalid to false if name has characters', function() {
            ctrl.newPlaylist = {
                name: 'a name',
            };
            ctrl.checkName();
            expect( ctrl.formIsInvalid ).to.be.false;
        });
    });

    describe( 'setPlaylist', function() {
        it( 'should set a new playlist', function() {
            ctrl.$onInit();
            $rootScope.$apply();
            var playlist = playlists[0];
            ctrl.playlistSelect = playlist.screen_id;
            ctrl.setPlaylist();
            expect( ctrl.updateProp.calledWith({ key: 'facilityid', value: playlist.facility_id })).to.be.true;
            expect( ctrl.updateProp.calledWith({ key: 'screenid', value: playlist.screen_id })).to.be.true;
        });
    });

    describe( 'createNewPlaylist', function() {
        it( 'should confirm creating a new announcement screen', function() {
            ctrl.newPlaylist = {
                name: 'my playlist',
                width: 1920,
                height: 1080,
            };
            var newPlaylistResult = TestData.getAnnouncement( ctrl.newPlaylist, true );
            createAnnouncementStub.returns( $q.resolve({ screen: newPlaylistResult }));
            ctrl.createNewPlaylist();
            $rootScope.$apply();
            expect( confirmModalOpenStub.calledOnce ).to.be.true;
        });

        it( 'should create a new playlist', function() {
            expect( ctrl.availablePlaylists.length ).to.equal( 0 );
            ctrl.newPlaylist = {
                name: 'my playlist',
                width: 1920,
                height: 1080,
            };
            var newPlaylistResult = TestData.getAnnouncement( ctrl.newPlaylist, true );
            createAnnouncementStub.returns( $q.resolve({ screen: newPlaylistResult }));
            ctrl.createNewPlaylist();
            $rootScope.$apply();
            expect( createAnnouncementStub.calledOnce ).to.be.true;
            expect( ctrl.availablePlaylists.length ).to.equal( 1 );
        });
    });
});
